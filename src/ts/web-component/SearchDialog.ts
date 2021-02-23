import { db, inited } from '../init';
import lf from "lovefield";
import { m_heroine } from '../model/m_heroine';
import { t_heroine_status } from '../model/t_heroine_status';

export class SearchDialog extends HTMLElement {
    constructor() {
        super();

        const owner = this;

        const shadowRoot = this.attachShadow({ mode: 'open' });

        shadowRoot.innerHTML = require('/src/html/編成検索/result.html').default +
            require('/src/html/編成検索/dialog.html').default +
            require('/src/html/編成検索/history.html').default
            ;

        let search_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#search_dialog');
        let matchs_tag = shadowRoot.querySelector('div#matchs');
        let history_tag: HTMLElement = shadowRoot.querySelector('div#history') ?? document.createElement('div');

        history_tag.querySelectorAll('ol li').forEach(li => { li.remove(); });

        if (search_dialog) {
            ((search_dialog: HTMLDialogElement) => {
                search_dialog.addEventListener('close', function () {
                    // body.appendChild(document.createTextNode(search_dialog.returnValue));
                    if (search_dialog.returnValue == 'ok') {
                        let checkboxies = search_dialog.querySelectorAll('form :checked');
                        let search_heroine_id_list: Array<string> = [];
                        checkboxies.forEach(checkbox => {
                            search_heroine_id_list.push((checkbox as HTMLInputElement).value);
                        });
                        // body.appendChild(document.createTextNode([...checkboxies].map(ele => {return ele.value}).join(',')));

                        inited.then(() => {
                            db.then(db => {
                                let table_m_heroine = db.getSchema().table('m_heroine');
                                let table_t_party_member = db.getSchema().table('t_party_member');
                                let table_t_match = db.getSchema().table('t_match');

                                let query = db.select(
                                    table_t_party_member.party_id.as('party_id'),
                                    lf.fn.count(lf.fn.distinct(table_t_party_member.heroine_id)).as('count')
                                ).
                                    from(table_t_party_member).
                                    innerJoin(table_t_match, table_t_match.loser_party_id.eq(table_t_party_member.party_id)).
                                    // where(lf.op.or.apply(null, search_heroine_id_list.map(search_heroine_id => {return table_t_party_member.heroine_id.eq(search_heroine_id);}))).
                                    where(table_t_party_member.heroine_id.in(search_heroine_id_list)).
                                    groupBy(table_t_party_member.party_id);
                                query.
                                    exec().
                                    then(results => {
                                        results = results.filter(o => ((o as { [count: string]: number }).count < 6));
                                        if (results.length == 0) {
                                            return;
                                        }
                                        // body.appendChild(document.createTextNode(JSON.stringify(results)));
                                        results = results.sort((a, b) => (b as { [count: string]: number }).count - (a as { [count: string]: number }).count);
                                        // body.appendChild(document.createTextNode(JSON.stringify(results)));
                                        results = results.filter(o => ((o as { [count: string]: number }).count == (results[0] as { [count: string]: number }).count));
                                        // body.appendChild(document.createTextNode(JSON.stringify(results)));

                                        let query = db.select(
                                            table_t_match.id.as('match_id'),
                                            table_t_party_member.party_id.as('party_id'),
                                            table_t_match.winner_party_id.as('winner_party_id'),
                                            table_t_match.loser_party_id.as('loser_party_id'),
                                            table_m_heroine.id.as('heroine_id'),
                                            table_m_heroine.name.as('name'),
                                            table_m_heroine.Costume.as('Costume'),
                                            table_t_match.remark.as('match_remark'),
                                            table_t_match.created_date.as('created_date'),
                                        ).
                                            from(table_t_party_member).
                                            leftOuterJoin(table_m_heroine, table_m_heroine.id.eq(table_t_party_member.heroine_id)).
                                            innerJoin(table_t_match, lf.op.or(
                                                table_t_match.winner_party_id.eq(table_t_party_member.party_id),
                                                lf.op.and(
                                                    table_t_match.loser_party_id.eq(table_t_party_member.party_id),
                                                    table_t_match.loser_party_id.in(results.map(l => (l as { [count: string]: number }).party_id))
                                                )
                                            )).
                                            orderBy(table_t_match.created_date, lf.Order.DESC).
                                            orderBy(table_t_party_member.party_id, lf.Order.ASC).
                                            orderBy(table_m_heroine.position_order, lf.Order.ASC);
                                        // body.appendChild(document.createTextNode(query.toSql()));
                                        query.exec().
                                            then((results) => {
                                                let dst: ({
                                                    [a: string]: ({
                                                        match_id: number;
                                                        winner: Array<string>;
                                                        loser: Array<({ name: string; heroine_id: number; })>;
                                                        created_date: Date;
                                                        match_remark: string;
                                                    })
                                                }) = {};
                                                results.forEach(src => {
                                                    ((src) => {
                                                        if (!dst[src.match_id]) {
                                                            dst[src.match_id] = {
                                                                match_id: src.match_id,
                                                                winner: [],
                                                                loser: [],
                                                                created_date: src.created_date,
                                                                match_remark: src.match_remark ?? '',
                                                            };
                                                        }
                                                        let display_name = src['name'] + '(' + src['Costume'] + ')';
                                                        if (src.party_id == src.winner_party_id) {
                                                            dst[src.match_id].winner.push(display_name);
                                                        } else {
                                                            dst[src.match_id].loser.push({
                                                                name: display_name,
                                                                heroine_id: src['heroine_id'],
                                                            });
                                                        }
                                                    })(src as ({
                                                        match_id: number;
                                                        party_id: number;
                                                        winner_party_id: number;
                                                        loser_party_id: number;
                                                        heroine_id: number;
                                                        name: string;
                                                        Costume: string;
                                                        match_remark: string;
                                                        created_date: Date;
                                                    }));
                                                });

                                                return Object.values(dst).filter(record => record.loser.length).sort((record1, record2) => record2.created_date.getTime() - record1.created_date.getTime());
                                            }).
                                            then((results) => {
                                                if (matchs_tag) {
                                                    ((matchs_tag: Element) => {
                                                        matchs_tag.innerHTML = '';
                                                        results.forEach(row => {
                                                            let line = document.createElement('div');
                                                            line.innerHTML = require('/src/html/編成検索/template_match_row.html').default;
                                                            row.winner.forEach((name, i) => {
                                                                line.querySelectorAll('[name=winner_party] [name=h' + i + ']').forEach(ele => {
                                                                    (ele as HTMLElement).innerText = name;
                                                                });
                                                            });
                                                            row.loser.forEach((info, i) => {
                                                                line.querySelectorAll('[name=loser_party] [name=h' + i + ']').forEach(ele => {
                                                                    (ele as HTMLElement).innerText = info.name;
                                                                    if (search_heroine_id_list.includes('' + info.heroine_id)) {
                                                                        (ele as HTMLElement).style.color = 'red';
                                                                    }
                                                                });
                                                            });
                                                            line.querySelectorAll('[name=match_info] [name=match_remark]').forEach(ele => {
                                                                (ele as HTMLElement).innerText = row.match_remark;
                                                            });
                                                            line.querySelectorAll('[name=match_info] [name=created_date]').forEach(ele => {
                                                                (ele as HTMLElement).innerText = `${row.created_date}`;
                                                            });
                                                            matchs_tag.appendChild(line);
                                                        });
                                                    })(matchs_tag);
                                                }
                                                ((list_tag) => {
                                                    let li_tag = document.createElement('li');
                                                    checkboxies.forEach(_checkbox => {
                                                        let checkbox = (_checkbox as HTMLInputElement);
                                                        const name = checkbox.getAttribute('data-name');
                                                        const cos = checkbox.getAttribute('data-Costume');
                                                        const id = checkbox.getAttribute('data-id');
                                                        let character_tag = document.createElement('span');
                                                        character_tag.innerText = `${name}（${cos}）`;
                                                        character_tag.setAttribute('data-id', `${id}`);
                                                        li_tag.appendChild(character_tag);
                                                    });
                                                    li_tag.addEventListener('click', () => {
                                                        owner.preopen(() => {
                                                            search_heroine_id_list.forEach(id => {
                                                                search_dialog.querySelectorAll('input[type=checkbox][value="' + id + '"]').forEach(ele => {
                                                                    (ele as HTMLInputElement).checked = true;
                                                                });
                                                            });
                                                        });
                                                    });
                                                    list_tag.prepend(li_tag);
                                                    if (list_tag.querySelectorAll('li').length > (5)) {
                                                        list_tag.querySelector('li:last-of-type')?.remove();
                                                    }
                                                })(history_tag.querySelector('ol') ?? document.createElement('ol'));
                                            });
                                    });
                            });
                        });
                    }
                });
                search_dialog.querySelector('button[value="ok"]')?.addEventListener('click', () => {
                    let checkboxies = search_dialog.querySelectorAll('form :checked');
                    if (checkboxies.length == 0) {
                        return false;
                    }
                    if (checkboxies.length > 5) {
                        return false;
                    }
                });

            })(search_dialog);
        }
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    attributeChangedCallback(attrName: String, oldVal: String, newVal: String) {
    }
    adoptedCallback() {
    }
    showModal(): void {
        this.preopen();
    }
    preopen(plugin = () => { }) {
        const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        let search_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#search_dialog');
        if (search_dialog) {
            let heroine_tag: (HTMLElement | null) = search_dialog.querySelector('#heroine');
            if (heroine_tag) {
                heroine_tag.innerHTML = '';
            }

            // Schema is defined, now connect to the database instance.
            db.then(function (db) {
                let table_m_heroine = db.getSchema().table('m_heroine');

                inited.then(() => {
                    return (db.select().from(table_m_heroine).orderBy(table_m_heroine.name, lf.Order.ASC).exec() as Promise<m_heroine[]>);
                }).then(function (results) {
                    results.forEach((row) => {
                        // body.appendChild(document.createTextNode(row['name'] + '(' + row['Costume'] + ')'));
                        heroine_tag?.appendChild(((row) => {
                            let checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.id = `heroine_id_${row.id}`;
                            checkbox.name = `heroine_id_${row.id}`;
                            checkbox.value = `${row.id}`;
                            Object.entries(row).forEach(([key, value]) => {
                                checkbox.setAttribute('data-' + key, `${value}`);
                            });
                            let label = document.createElement('label');
                            label.setAttribute('for', checkbox.id);
                            label.innerText = row['name'] + '(' + row['Costume'] + ')';
                            let div = document.createElement('div');
                            div.appendChild(checkbox);
                            div.appendChild(label);

                            return div;
                        })(row));
                    });
                }).then(() => {
                    return plugin();
                }).then(() => {
                    search_dialog?.showModal();
                });
            });
        }
    }
}
