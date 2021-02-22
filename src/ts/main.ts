import {RegisterDialog} from './web-component/RegisterDialog';
import {SearchDialog} from './web-component/SearchDialog';
import {HeroinesPossessionStatusDialog} from './web-component/HeroinesPossessionStatusDialog';
import {db, inited} from './init';
import {m_heroine} from './model/m_heroine';
import lf from "lovefield";

inited.then(() => {
    window.customElements.define('ib7zpxivoeuou9s6-search_dialog', SearchDialog);
    window.customElements.define('ib7zpxivoeuou9s6-register_dialog', RegisterDialog);
    window.customElements.define('ib7zpxivoeuou9s6-heroines_possession_status_dialog', HeroinesPossessionStatusDialog);
});

document.querySelector('button#open_search_dialog')?.addEventListener('click', () => {
    document.querySelectorAll('ib7zpxivoeuou9s6-search_dialog').forEach(dialog => {
        (dialog as SearchDialog).showModal();
    });
});

document.querySelector('button#open_register_dialog')?.addEventListener('click', () => {
    document.querySelectorAll('ib7zpxivoeuou9s6-register_dialog').forEach(dialog => {
        (dialog as RegisterDialog).showModal();
    });
});

document.querySelector('button#open_heroines_possession_status_dialog')?.addEventListener('click', () => {
    document.querySelectorAll('ib7zpxivoeuou9s6-heroines_possession_status_dialog').forEach(dialog => {
        (dialog as HeroinesPossessionStatusDialog).showModal();
    });
});