import lf from "lovefield";
import {m_heroine_json} from './model/m_heroine_json';

// Begin schema creation.
export var schemaBuilder = lf.schema.create('lf_websql1_db', 6);

schemaBuilder.createTable('m_heroine').
    addColumn('id', lf.Type.INTEGER).
    addColumn('name', lf.Type.STRING).
    addColumn('front', lf.Type.INTEGER).
    addColumn('back', lf.Type.INTEGER).
    addColumn('position_label', lf.Type.STRING).
    addColumn('Costume', lf.Type.STRING).
    addColumn('position_order', lf.Type.INTEGER).
    addColumn('created_date', lf.Type.DATE_TIME).
    addColumn('last_modified_date', lf.Type.DATE_TIME).
    addColumn('star_6_date', lf.Type.DATE_TIME).
    addColumn('special_weapon_date', lf.Type.DATE_TIME).
    addColumn('since', lf.Type.DATE_TIME).
    addColumn('style', lf.Type.INTEGER).
    addNullable(['star_6_date','special_weapon_date']).
    addPrimaryKey(['id'], true);

schemaBuilder.createTable('t_party').
    addColumn('id', lf.Type.INTEGER).
    addColumn('remark', lf.Type.STRING).
    addColumn('created_date', lf.Type.DATE_TIME).
    addColumn('last_modified_date', lf.Type.DATE_TIME).
    addNullable(['remark']).
    addPrimaryKey(['id'], true);

schemaBuilder.createTable('t_party_member').
    addColumn('id', lf.Type.INTEGER).
    addColumn('party_id', lf.Type.INTEGER).
    addColumn('heroine_id', lf.Type.INTEGER).
    addColumn('star', lf.Type.INTEGER).
    addColumn('has_special_weapon', lf.Type.BOOLEAN).
    addColumn('level', lf.Type.INTEGER).
    addColumn('rank', lf.Type.INTEGER).
    addColumn('created_date', lf.Type.DATE_TIME).
    addColumn('last_modified_date', lf.Type.DATE_TIME).
    addNullable(['star','has_special_weapon','level','rank']).
    addPrimaryKey(['id'], true).
    addForeignKey('fk_party_id', {
        local: 'party_id',
        ref: 't_party.id',
    }).
    addForeignKey('fk_heroine_id', {
        local: 'heroine_id',
        ref: 'm_heroine.id',
    });

schemaBuilder.createTable('t_match').
    addColumn('id', lf.Type.INTEGER).
    addColumn('winner_party_id', lf.Type.INTEGER).
    addColumn('loser_party_id', lf.Type.INTEGER).
    addColumn('remark', lf.Type.STRING).
    addColumn('created_date', lf.Type.DATE_TIME).
    addColumn('last_modified_date', lf.Type.DATE_TIME).
    addNullable(['remark']).
    addPrimaryKey(['id'], true).
    addForeignKey('fk_winner_party_id', {
        local: 'winner_party_id',
        ref: 't_party.id',
    }).
    addForeignKey('fk_loser_party_id', {
        local: 'loser_party_id',
        ref: 't_party.id',
    });

schemaBuilder.createTable('t_heroine_status').
    addColumn('id', lf.Type.INTEGER).
    addColumn('heroine_id', lf.Type.INTEGER).
    addColumn('star', lf.Type.INTEGER).
    addColumn('special_weapon_level', lf.Type.INTEGER).
    addColumn('level', lf.Type.INTEGER).
    addColumn('rank', lf.Type.INTEGER).
    addColumn('created_date', lf.Type.DATE_TIME).
    addColumn('last_modified_date', lf.Type.DATE_TIME).
    addColumn('deleted', lf.Type.BOOLEAN).
    addNullable(['level','rank']).
    addPrimaryKey(['id'], true).
    addForeignKey('fk_heroine_id', {
        local: 'heroine_id',
        ref: 'm_heroine.id',
    });

export const db:Promise<lf.Database> = schemaBuilder.connect();

export let inited = db.then(function(db) {
    // Schema is not mutable once the connection to DB has established.

    let req = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        req.onreadystatechange = (req) => {
            if ((req.target as XMLHttpRequest).readyState == 4 && (req.target as XMLHttpRequest).status == 200) {
                resolve(JSON.parse((req.target as XMLHttpRequest).responseText));
            } else if ((req.target as XMLHttpRequest).readyState == 4) {
                reject();
            }
        };
        req.open('GET', './m_heroine.json?d=' + (new Date().getTime()), false);
        req.send();
    }).then(function(m_heroine_data){
        let table_m_heroine = db.getSchema().table('m_heroine');

        const data = (m_heroine_data as Array<m_heroine_json>);
        let rows = data.map(element => {
            element.since = new Date();
            element.style = -1;
            element.created_date = new Date(element.created_date);
            if (!element.last_modified_date) {
                element.last_modified_date = element.created_date;
            } else {
                element.last_modified_date = new Date(element.created_date);
            }
            const row = table_m_heroine.createRow(element);

            return row;
        });
        let query = db.insertOrReplace().into(table_m_heroine).values(rows);
        // body.appendChild(document.createTextNode(query.toSql()));

        return query.exec();
    }).then(() => {
    });
});