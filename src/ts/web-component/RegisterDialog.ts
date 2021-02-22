import { db, inited } from '../init';
import lf from "lovefield";
import { m_heroine } from '../model/m_heroine';
import { t_heroine_status } from '../model/t_heroine_status';

export class RegisterDialog extends HTMLElement {
    constructor() {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });

        const html = require('/src/html/編成登録/dialog.html');
        console.log(html);
        shadowRoot.innerHTML = html.default;

        let register_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#register_dialog');
        let heroine_select_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#heroine_select_dialog');

        if (register_dialog) {
            ((register_dialog: HTMLDialogElement) => {
                register_dialog.querySelectorAll('fieldset>button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (heroine_select_dialog) {
                            (heroine_select_dialog as {[key:string]:any}).sender = btn;
                            heroine_select_dialog.showModal();
                        }
                    });
                });
                register_dialog.addEventListener('close', function () {
                    if (register_dialog.returnValue == 'ok') {
                        inited.then(() => {
                            db.then(db => {
                                let table_t_match = db.getSchema().table('t_match');
                                let table_t_party = db.getSchema().table('t_party');
                                let table_t_party_member = db.getSchema().table('t_party_member');

                                let tx = db.createTransaction();

                                let matches: Element[] = [];
                                register_dialog.querySelectorAll('[data-match]').forEach(ele => {
                                    matches.push(ele);
                                });
                                let match_remark = (register_dialog.querySelector('[name="match_remark"]') as HTMLInputElement)?.value ?? '';

                                let party_id_1 = -1;
                                let party_id_2 = -1;

                                tx.begin([
                                    table_t_match,
                                    table_t_party,
                                    table_t_party_member,
                                ]).then(() => {
                                    let query = db.insert().into(table_t_party).values([
                                        table_t_party.createRow({ created_date: new Date(), last_modified_date: new Date(), }),
                                    ]);

                                    return tx.attach(query);
                                }).then((results) => {
                                    const party_id = (results[0] as { [id: string]: number }).id;
                                    party_id_1 = party_id;

                                    let query = db.insert().into(table_t_party_member).values(matches.filter(ele => { return ele.getAttribute('data-match') == 'winner' }).map(ele => {
                                        return table_t_party_member.createRow({ party_id: party_id, heroine_id: (ele as HTMLButtonElement).value, created_date: new Date(), last_modified_date: new Date(), })
                                    }));

                                    return tx.attach(query);
                                }).then(() => {
                                    let query = db.insert().into(table_t_party).values([
                                        table_t_party.createRow({ created_date: new Date(), last_modified_date: new Date(), }),
                                    ]);

                                    return tx.attach(query);
                                }).then((results) => {
                                    const party_id = (results[0] as { [id: string]: number }).id;
                                    party_id_2 = party_id;

                                    let query = db.insert().into(table_t_party_member).values(matches.filter(ele => { return ele.getAttribute('data-match') == 'loser' }).map(ele => {
                                        return table_t_party_member.createRow({ party_id: party_id, heroine_id: (ele as HTMLButtonElement).value, created_date: new Date(), last_modified_date: new Date(), })
                                    }));

                                    return tx.attach(query);
                                }).then(() => {
                                    let query = db.insert().into(table_t_match).values([
                                        table_t_match.createRow({
                                            winner_party_id: party_id_1,
                                            loser_party_id: party_id_2,
                                            remark: match_remark,
                                            created_date: new Date(),
                                            last_modified_date: new Date(),
                                        }),
                                    ]);

                                    return tx.attach(query);
                                }).then((results) => {
                                    const match_id = (results[0] as { [id: string]: number }).id;
                                    tx.commit();

                                    return { party_id: party_id_1, match_id: match_id };
                                });
                            });
                        });
                    }
                });
            })(register_dialog);
        }
        if (heroine_select_dialog) {
            ((heroine_select_dialog:HTMLDialogElement) => {
                heroine_select_dialog.addEventListener('close', function () {
                    let info = JSON.parse(heroine_select_dialog.returnValue);
                    let sender = (heroine_select_dialog as {[key:string]:any}).sender;
                    sender.value = info.id;
                    sender.innerHTML = info.innerHTML;
                    if (sender.getAttribute('data-match') == 'winner') {
                        const party_member_id = sender.getAttribute('data-party_member_id');
                        let infotag = register_dialog?.querySelector('div[data-party_member_id="'+party_member_id+'"]');
                        if (infotag) {
                            infotag.querySelectorAll('[name="star"]').forEach(ele => {
                                (ele as HTMLSelectElement).value = info?.star;
                            });
                            infotag.querySelectorAll('[name="level"]').forEach(ele => {
                                (ele as HTMLInputElement).value = info?.level;
                            });
                            infotag.querySelectorAll('[name="rank"]').forEach(ele => {
                                (ele as HTMLInputElement).value = info?.rank;
                            });
                            infotag.querySelectorAll('[name="special_weapon_level"]').forEach(ele => {
                                (ele as HTMLInputElement).value = info?.special_weapon_level;
                            });
                        }
                    }
                });
            })(heroine_select_dialog);
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
    preopen() {
        const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

        let heroine_select_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#heroine_select_dialog');
        let heroine_select_form: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#heroine_select_dialog>form');

        if (heroine_select_form) {
            ((heroine_select_form: HTMLDialogElement) => {
                heroine_select_form.innerHTML = '';
                inited.then(() => {
                    db.then(db => {
                        Promise.resolve(
                        ).then(function () {

                            let table_m_heroine = db.getSchema().table('m_heroine');
                            let table_t_heroine_status = db.getSchema().table('t_heroine_status');

                            let query = db.
                                select(
                                ).
                                from(table_m_heroine).
                                leftOuterJoin(table_t_heroine_status, table_t_heroine_status.heroine_id.eq(table_m_heroine.id)).
                                orderBy(table_m_heroine.name, lf.Order.ASC);

                            return query.exec();
                        }).then(function (results) {
                            interface RecordBase {
                                m_heroine: m_heroine;
                                t_heroine_status: t_heroine_status;
                            }
                            results.forEach(row => {

                                ((row) => {
                                    // body.appendChild(document.createTextNode(row['name'] + '(' + row['Costume'] + ')'));
                                    let button = document.createElement('button');
                                    heroine_select_form.appendChild(((row) => {
                                        button.innerText = row.m_heroine['name'] + '(' + row.m_heroine['Costume'] + ')';
                                        button.value = JSON.stringify({
                                            id: row.m_heroine['id'],
                                            innerHTML: button.innerText,
                                            star: (row.t_heroine_status.deleted ?? true) ? null : row.t_heroine_status.star,
                                            level: (row.t_heroine_status.deleted ?? true) ? null : row.t_heroine_status.level,
                                            rank: (row.t_heroine_status.deleted ?? true) ? null : row.t_heroine_status.rank,
                                            special_weapon_level: (row.t_heroine_status.deleted ?? true) ? null : row.t_heroine_status.special_weapon_level,
                                        });
                                        button.setAttribute('data-deleted', `${row.t_heroine_status.deleted ?? false}`);
                                        button.setAttribute('data-initial', row.m_heroine['name'].substr(0, 1));
                                        button.setAttribute('data-initial_group', ((initial) => {
                                            if ('アイウエオ'.indexOf(initial) >= 0) {
                                                return '1';
                                            }
                                            if ('カキクケコガギグゲゴ'.indexOf(initial) >= 0) {
                                                return '2';
                                            }
                                            if ('サシスセソザジズゼゾ'.indexOf(initial) >= 0) {
                                                return '3';
                                            }
                                            if ('タチツテトナニヌネノハヒフヘホダヂヅデドバビブベボパピプペポ'.indexOf(initial) >= 0) {
                                                return '4';
                                            }
                                            if ('マミムメモ'.indexOf(initial) >= 0) {
                                                return '5';
                                            }
                                            if ('ヤユヨラリルレロワヲン'.indexOf(initial) >= 0) {
                                                return '6';
                                            }

                                            return '0';
                                        })(row.m_heroine['name'].substr(0, 1)));
                                        return button;
                                    })(row));
                                })(row as RecordBase);
                            });
                        }).then(() => {
                            let register_dialog: (HTMLDialogElement | null) = shadowRoot.querySelector('dialog#register_dialog');
                            register_dialog?.showModal();
                        });
                    });
                });
            })(heroine_select_form);
        }
    }
}
