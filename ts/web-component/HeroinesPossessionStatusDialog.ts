import { db, inited } from '../init';
import lf from "lovefield";
import {m_heroine} from '../model/m_heroine';
import {t_heroine_status} from '../model/t_heroine_status';

export class HeroinesPossessionStatusDialog extends HTMLElement {
    constructor() {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });

        shadowRoot.innerHTML = require('/src/html/所持キャラ登録/dialog.html').default;
        let heroines_possession_status_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#heroines_possession_status_dialog');
        heroines_possession_status_dialog?.addEventListener('close', function () {
            heroines_possession_status_dialog = (heroines_possession_status_dialog) as HTMLDialogElement;
            if (heroines_possession_status_dialog.returnValue == 'ok') {
                inited.then(() => {
                    db.then(db => {
                        let table_t_heroine_status = db.getSchema().table('t_heroine_status');

                        let rows: any[] = [];
                        heroines_possession_status_dialog?.querySelectorAll('[name="heroines"] [name="row"]').forEach(row => {
                            let t_heroine_status_id = row.getAttribute('data-id');
                            const heroine_id = row.getAttribute('data-heroine_id');
                            const deleted = !row.querySelector('[name="has_this"] input[type="checkbox"]:checked');
                            const star = (row.querySelector('[data-star]') as HTMLSelectElement)?.value;
                            const special_weapon_level = (row.querySelector('[data-special_weapon_level]') as HTMLInputElement)?.value;
                            const level = (row.querySelector('[data-level]') as HTMLInputElement)?.value;
                            const rank = (row.querySelector('[data-rank]') as HTMLInputElement)?.value;
                            // console.log([t_heroine_status_id,heroine_id,deleted,star,special_weapon_level,level,rank]);

                            let recordsinfo = {
                                id: null as (String | null),
                                heroine_id: heroine_id,
                                deleted: deleted,
                                star: star,
                                special_weapon_level: special_weapon_level,
                                level: level,
                                rank: rank,
                                created_date: null as (Date | null),
                                last_modified_date: new Date(),
                            };
                            if (t_heroine_status_id) {
                                recordsinfo.id = t_heroine_status_id;
                            } else {
                                recordsinfo.created_date = new Date();
                            }

                            rows.push(recordsinfo);
                        });

                        let tx = db.createTransaction();
                        tx.begin([
                            table_t_heroine_status,
                        ]).
                            then(() => {
                                let query = db.
                                    update(table_t_heroine_status).
                                    set(table_t_heroine_status.deleted, lf.bind(1)).
                                    set(table_t_heroine_status.star, lf.bind(2)).
                                    set(table_t_heroine_status.special_weapon_level, lf.bind(3)).
                                    set(table_t_heroine_status.level, lf.bind(4)).
                                    set(table_t_heroine_status.rank, lf.bind(5)).
                                    set(table_t_heroine_status.last_modified_date, new Date()).
                                    where(lf.op.and(
                                        table_t_heroine_status.id.eq(lf.bind(0)),
                                        lf.op.or(
                                            table_t_heroine_status.deleted.neq(lf.bind(1)),
                                            table_t_heroine_status.star.neq(lf.bind(2)),
                                            table_t_heroine_status.special_weapon_level.neq(lf.bind(3)),
                                            table_t_heroine_status.level.neq(lf.bind(4)),
                                            table_t_heroine_status.rank.neq(lf.bind(5))
                                        )
                                    ));

                                console.log(query.toSql());

                                return (async () => {
                                    for (let row of rows.filter(row => { return !!row.id; })) {
                                        await tx.attach(query.bind([row.id, row.deleted, row.star, row.special_weapon_level, row.level, row.rank]));
                                    }
                                })()
                            }).
                            then(() => {
                                let query = db.insert().into(table_t_heroine_status).values(rows.filter(row => { return !row.id; }).map(row => {
                                    return table_t_heroine_status.createRow(row);
                                }));
                                console.log(query.toSql());

                                return tx.attach(query);
                            }).
                            then(() => {
                                tx.commit();
                            });
                    });
                });
            }
        });
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    attributeChangedCallback(attrName: String, oldVal: String, newVal: String) {
    }
    adoptedCallback() {
    }
    showModal():void {
        this.preopen();
    }
    preopen() {
        const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        let heroines_possession_status_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#heroines_possession_status_dialog');

        heroines_possession_status_dialog?.querySelectorAll('[name="heroines"]').forEach(ele => {
            ele.innerHTML = '';
        });

        inited.then(() => {
            db.then(db => {
                let table_m_heroine = db.getSchema().table('m_heroine');
                let table_t_heroine_status = db.getSchema().table('t_heroine_status');

                let query = db.
                    select().
                    from(table_m_heroine).
                    leftOuterJoin(table_t_heroine_status, table_t_heroine_status.heroine_id.eq(table_m_heroine.id)).
                    orderBy(table_m_heroine.name, lf.Order.ASC).
                    orderBy(table_m_heroine.Costume, lf.Order.ASC);
                query.exec().then((results) => {

                    const tmpl = require('/src/html/所持キャラ登録/template_heroine_row.html').default;;
                    let h_list = heroines_possession_status_dialog?.querySelector('[name="heroines"]');

                    interface RecordBase {
                        m_heroine: m_heroine;
                        t_heroine_status: t_heroine_status;
                    }

                    results.forEach((r) => {
                        let record:RecordBase = (r as RecordBase);
                        let ele = document.createElement('div');
                        ele.innerHTML = tmpl;
                        const has_data = record.t_heroine_status && (record.t_heroine_status.id != null);

                        ele.querySelectorAll('[data-id]').forEach(e => {
                            if (record.t_heroine_status.id) {
                                e.setAttribute('data-id', `${record.t_heroine_status.id}`);
                            } else {
                                e.removeAttribute('data-id');
                            }
                        });
                        ele.querySelectorAll('[data-heroine_id]').forEach(e => {
                            e.setAttribute('data-heroine_id', `${record.m_heroine.id}`);
                        });
                        ele.querySelectorAll('[name="name"]').forEach(e => {
                            (e as HTMLElement).innerText = record.m_heroine.name + '(' + record.m_heroine.Costume + ')';
                            e.setAttribute('for', 'heroines_possession_status_dialog_heroine_row_' + record.m_heroine.id);
                        });
                        ele.querySelectorAll('[name="has_this"] input[type="checkbox"]').forEach(e => {
                            e.id = 'heroines_possession_status_dialog_heroine_row_' + record.m_heroine.id;
                            if (!record.t_heroine_status || (record.t_heroine_status.id == null)) {
                                (e as HTMLInputElement).checked = true;
                            } else {
                                (e as HTMLInputElement).checked = !record.t_heroine_status.deleted;
                            }
                        });
                        if (has_data) {
                            ele.querySelectorAll('[data-star]').forEach(e => {
                                (e as HTMLInputElement).value = `${record.t_heroine_status.star}`;
                                e.setAttribute('data-star', (e as HTMLInputElement).value);
                            });

                            ele.querySelectorAll('[data-special_weapon_level]').forEach(e => {
                                (e as HTMLInputElement).value = `${record.t_heroine_status.special_weapon_level}`;
                                e.setAttribute('data-special_weapon_level', (e as HTMLInputElement).value);
                            });

                            ele.querySelectorAll('[data-level]').forEach(e => {
                                (e as HTMLInputElement).value = `${record.t_heroine_status.level}`;
                                e.setAttribute('data-level', (e as HTMLInputElement).value);
                            });

                            ele.querySelectorAll('[data-rank]').forEach(e => {
                                (e as HTMLInputElement).value = `${record.t_heroine_status.rank}`;
                                e.setAttribute('data-rank', (e as HTMLInputElement).value);
                            });

                            ele.querySelectorAll('[name="last_modified_date"]').forEach(e => {
                                (e as HTMLElement).innerText = record.t_heroine_status.last_modified_date.toLocaleDateString();
                            });
                        }

                        h_list?.appendChild(ele.querySelector('[name="row"]') ?? document.createElement('div'));
                    });
                }).then(() => {
                    heroines_possession_status_dialog?.showModal();
                });
            });
        });
    }
}
