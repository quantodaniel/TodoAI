(function () {
  'use strict';

  var KEY = 'todoai.todos';
  var todos = load();
  var filter = 'all';

  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var list = document.getElementById('todo-list');
  var count = document.getElementById('count');
  var announcer = document.getElementById('announcer');

  // What render() should focus once the list has been rebuilt, or null.
  var pendingFocus = null;

  function isTodo(value) {
    return value !== null && typeof value === 'object' &&
      typeof value.id === 'string' && value.id !== '' &&
      typeof value.text === 'string' && value.text.trim() !== '' &&
      typeof value.done === 'boolean';
  }

  // Trust nothing from storage: it may be missing, corrupted, or written by
  // another origin's script. Anything that is not a well-formed todo is dropped.
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      var seen = Object.create(null);
      return parsed.filter(function (item) {
        if (!isTodo(item) || seen[item.id]) return false;
        seen[item.id] = true;
        return true;
      }).map(function (item) {
        return { id: item.id, text: item.text, done: item.done };
      });
    } catch (e) {
      return [];
    }
  }

  function uid() {
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(todos));
    } catch (e) { /* storage unavailable */ }
  }

  function byId(id) {
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === id) return todos[i];
    }
    return null;
  }

  function visible() {
    if (filter === 'active') return todos.filter(function (t) { return !t.done; });
    if (filter === 'done') return todos.filter(function (t) { return t.done; });
    return todos;
  }

  function visibleIndex(id) {
    var items = visible();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return i;
    }
    return -1;
  }

  // Polite announcement for changes that have no other audible feedback.
  // Clearing first makes a repeated message speak again.
  function announce(message) {
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = message; }, 50);
  }

  // Record where focus should land after the next render: `control` is the
  // class of the target inside the item, `index` its place in the visible
  // list, used as a fallback when the item itself is gone. Only applies when
  // focus is already inside the list, so a mouse click elsewhere (or a blur)
  // never has focus pulled back.
  function focusAfterRender(id, control) {
    if (!list.contains(document.activeElement)) return;
    pendingFocus = { id: id, control: control, index: visibleIndex(id) };
  }

  function itemNode(id) {
    var nodes = list.querySelectorAll('li[data-id]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.id === id) return nodes[i];
    }
    return null;
  }

  function restoreFocus() {
    if (!pendingFocus) return;
    var target = pendingFocus;
    pendingFocus = null;

    var li = itemNode(target.id);
    if (!li) {
      var nodes = list.querySelectorAll('li[data-id]');
      if (!nodes.length) {
        input.focus();
        return;
      }
      li = nodes[Math.min(target.index, nodes.length - 1)];
    }

    var el = li.querySelector('.' + target.control);
    if (!el || el.disabled) el = li.querySelector('.text');
    if (el) el.focus();
  }

  function render() {
    list.innerHTML = '';
    var items = visible();
    var frag = document.createDocumentFragment();

    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Nothing here yet.';
      frag.appendChild(empty);
    }

    items.forEach(function (todo) {
      var li = document.createElement('li');
      li.dataset.id = todo.id;
      li.className = todo.done ? 'item done' : 'item';

      var toggle = document.createElement('label');
      toggle.className = 'toggle';

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'check';
      box.checked = todo.done;
      box.setAttribute('aria-label', 'Toggle ' + todo.text);
      toggle.appendChild(box);

      var span = document.createElement('span');
      span.className = 'text';
      span.textContent = todo.text;

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon del';
      del.textContent = '×';
      del.setAttribute('aria-label', 'Delete ' + todo.text);

      li.appendChild(toggle);
      li.appendChild(span);
      li.appendChild(del);
      frag.appendChild(li);
    });

    list.appendChild(frag);

    // Only touch the live region when the text changes, so screen readers
    // are not told about a count that did not move.
    var left = todos.filter(function (t) { return !t.done; }).length;
    var summary = left + (left === 1 ? ' item left' : ' items left');
    if (count.textContent !== summary) count.textContent = summary;

    restoreFocus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    todos = todos.concat([{ id: uid(), text: text, done: false }]);
    input.value = '';
    save();
    render();
  });

  list.addEventListener('click', function (e) {
    var li = e.target.closest('li[data-id]');
    if (!li) return;
    var id = li.dataset.id;
    var todo = byId(id);
    if (!todo) return;

    if (e.target.matches('.check')) {
      focusAfterRender(id, 'check');
      todos = todos.map(function (t) { return t.id === id ? { id: t.id, text: t.text, done: !t.done } : t; });
      save();
      render();
    } else if (e.target.matches('.del')) {
      focusAfterRender(id, 'del');
      todos = todos.filter(function (t) { return t.id !== id; });
      save();
      render();
      announce('Deleted “' + todo.text + '”');
    }
  });

  document.querySelector('.filters').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(function (b) {
      var selected = b === btn;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    render();
  });

  document.getElementById('clear-done').addEventListener('click', function () {
    var done = todos.filter(function (t) { return t.done; }).length;
    if (!done) {
      announce('No done items to clear');
      return;
    }
    todos = todos.filter(function (t) { return !t.done; });
    save();
    render();
    announce(done === 1 ? 'Cleared 1 done item' : 'Cleared ' + done + ' done items');
  });

  render();
})();
