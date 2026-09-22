(function () {
  'use strict';

  var KEY = 'todoai.todos';
  var todos = load();
  var filter = 'all';

  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var list = document.getElementById('todo-list');
  var count = document.getElementById('count');

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

  function visible() {
    if (filter === 'active') return todos.filter(function (t) { return !t.done; });
    if (filter === 'done') return todos.filter(function (t) { return t.done; });
    return todos;
  }

  function render() {
    list.innerHTML = '';
    var items = visible();

    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Nothing here yet.';
      list.appendChild(empty);
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
      list.appendChild(li);
    });

    // Only touch the live region when the text changes, so screen readers
    // are not told about a count that did not move.
    var left = todos.filter(function (t) { return !t.done; }).length;
    var summary = left + (left === 1 ? ' item left' : ' items left');
    if (count.textContent !== summary) count.textContent = summary;
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

    if (e.target.matches('.check')) {
      todos = todos.map(function (t) { return t.id === id ? { id: t.id, text: t.text, done: !t.done } : t; });
      save();
      render();
    } else if (e.target.matches('.del')) {
      todos = todos.filter(function (t) { return t.id !== id; });
      save();
      render();
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
    todos = todos.filter(function (t) { return !t.done; });
    save();
    render();
  });

  render();
})();
