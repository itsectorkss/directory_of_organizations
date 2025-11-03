import { seed } from './seed';
import { debounce, formatRuPhone } from './utils';
import type { Org, SortKey } from './types';
import {
    init, subscribe, getState, setSort, setQuery, setPage, setPageSize,
    add, remove, pageItems, pageCount
} from './store';

const app = document.getElementById('app')!;

function addr(a: Org['address']) {
    return `г. ${a.city}, ул. ${a.street}, д. ${a.house}`;
}

function render() {
    const s = getState();
    const rows = pageItems().map(o => `
    <tr data-id="${o.id}">
      <td>${escapeHtml(o.name)}</td>
      <td>${escapeHtml(o.director)}</td>
      <td>${escapeHtml(o.phone)}</td>
      <td>${escapeHtml(addr(o.address))}</td>
      <td class="right"><span class="x" data-action="delete" title="Удалить">×</span></td>
    </tr>
  `).join('');

    // --- сохранить фокус/каретку, если в поиске
    const active = document.activeElement as HTMLElement | null;
    let restoreSearch = false;
    let caretStart = 0;
    let caretEnd = 0;

    if (active && active.id === 'search' && active instanceof HTMLInputElement) {
        restoreSearch = true;
        caretStart = active.selectionStart ?? active.value.length;
        caretEnd = active.selectionEnd ?? active.value.length;
    }

    app.innerHTML = `
    <h1 style="margin:0 0 12px 0;">Справочник организаций</h1>
    <div class="toolbar">
      <input id="search" type="text" placeholder="Найти по ФИО..." value="${escapeAttr(s.query)}" />
      <button class="btn primary" id="addBtn">Добавить</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            ${thSortable('Название', 'name', s.sortKey, s.sortDir)}
            ${thSortable('ФИО директора', 'director', s.sortKey, s.sortDir)}
            <th>Номер телефона</th>
            <th>Адрес</th>
            <th class="right">Удалить</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" class="muted">Нет данных</td></tr>`}
        </tbody>
      </table>

      <div class="pagination">
        <label class="muted">на странице</label>
        <select id="pageSize">
          ${[10, 20, 50].map(x => `<option value="${x}" ${x === s.pageSize ? 'selected' : ''}>${x}</option>`).join('')}
        </select>
        <button class="btn" id="prev" ${s.page === 1 ? 'disabled' : ''}>Назад</button>
        <span>стр. ${s.page} / ${pageCount()}</span>
        <button class="btn" id="next" ${s.page >= pageCount() ? 'disabled' : ''}>Вперёд</button>
      </div>
    </div>
  `;

    // events
    (document.getElementById('addBtn') as HTMLButtonElement).onclick = openAddDialog;

    const search = document.getElementById('search') as HTMLInputElement;
    search.oninput = debounce(() => setQuery(search.value), 250);

    // --- восстановить фокус/каретку
    if (restoreSearch && search) {
        search.focus();
        // положим каретку в те же позиции (защита, если строка короче)
        const len = search.value.length;
        const start = Math.min(caretStart, len);
        const end = Math.min(caretEnd, len);
        search.setSelectionRange(start, end);
    }

    (document.getElementById('prev') as HTMLButtonElement).onclick = () => setPage(getState().page - 1);
    (document.getElementById('next') as HTMLButtonElement).onclick = () => setPage(getState().page + 1);
    (document.getElementById('pageSize') as HTMLSelectElement).onchange = (e) => setPageSize(+((e.target as HTMLSelectElement).value));

    // delegation: sort & delete
    const thead = app.querySelector('thead')!;
    thead.addEventListener('click', (e) => {
        const th = (e.target as HTMLElement).closest('th[data-sort]') as HTMLElement | null;
        if (th) setSort(th.dataset.sort as SortKey);
    });

    const tbody = app.querySelector('tbody')!;
    tbody.addEventListener('click', (e) => {
        const el = (e.target as HTMLElement).closest('[data-action="delete"]') as HTMLElement | null;
        if (el) {
            const tr = (el.closest('tr') as HTMLElement);
            const id = tr?.dataset.id!;
            remove(id);
        }
    });
}

function thSortable(label: string, by: SortKey, key: SortKey, dir: 'asc' | 'desc') {
    const active = key === by;
    const arrow = active ? (dir === 'asc' ? '↑' : '↓') : '';
    return `<th class="sortable" data-sort="${by}">${label} ${active ? `<span class="muted">${arrow}</span>` : ''}</th>`;
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function escapeAttr(s: string) {
    return escapeHtml(s).replace(/"/g, '&quot;');
}

// ----- Add Dialog -----
function openAddDialog() {
    const dlg = document.getElementById('addDialog') as HTMLDialogElement;
    const ok = document.getElementById('f-ok') as HTMLButtonElement;
    const fields = {
        name: document.getElementById('f-name') as HTMLInputElement,
        director: document.getElementById('f-director') as HTMLInputElement,
        city: document.getElementById('f-city') as HTMLInputElement,
        street: document.getElementById('f-street') as HTMLInputElement,
        house: document.getElementById('f-house') as HTMLInputElement,
        phone: document.getElementById('f-phone') as HTMLInputElement,
    };

    const err = (key: keyof typeof fields) => document.querySelector(`[data-err="${key}"]`) as HTMLElement;

    function validate() {
        const requiredOk = !!fields.name.value && !!fields.director.value && !!fields.city.value && !!fields.street.value && !!fields.house.value;
        const phone = formatRuPhone(fields.phone.value);
        ok.disabled = !(requiredOk && phone.isComplete);

        // подсветка
        (['name', 'director', 'city', 'street', 'house'] as const).forEach(k => {
            const bad = !fields[k].value;
            fields[k].classList.toggle('error', bad && fields[k].dataset.touched === '1');
            err(k).hidden = !(bad && fields[k].dataset.touched === '1');
        });
        fields.phone.classList.toggle('error', !phone.isComplete && fields.phone.dataset.touched === '1');
    }

    // ввод/маска телефона
    fields.phone.addEventListener('input', () => {
        const { formatted } = formatRuPhone(fields.phone.value);
        if (fields.phone.value !== formatted) fields.phone.value = formatted;
        fields.phone.dataset.touched = '1';
        validate();
    });

    // blur для required
    (['name', 'director', 'city', 'street', 'house'] as const).forEach(k => {
        fields[k].addEventListener('blur', () => {
            fields[k].dataset.touched = '1';
            validate();
        });
    });

    // кнопки
    dlg.querySelectorAll('[data-close]').forEach(b => (b as HTMLButtonElement).onclick = () => dlg.close());

    ok.onclick = () => {
        const phone = formatRuPhone(fields.phone.value);
        if (ok.disabled) return;

        const org: Org = {
            id: crypto.randomUUID(),
            name: fields.name.value.trim(),
            director: fields.director.value.trim(),
            phone: phone.formatted,
            address: { city: fields.city.value.trim(), street: fields.street.value.trim(), house: fields.house.value.trim() }
        };
        add(org);
        dlg.close();
    };

    dlg.addEventListener('close', cleanup, { once: true });

    function cleanup() {
        // сброс формы
        Object.values(fields).forEach(i => { i.value = ''; i.classList.remove('error'); i.dataset.touched = ''; });
        (['name', 'director', 'city', 'street', 'house'] as const).forEach(k => err(k).hidden = true);
        ok.disabled = true;
    }

    validate();
    dlg.showModal();
}

// bootstrap
init(seed);
subscribe(render);
render();
