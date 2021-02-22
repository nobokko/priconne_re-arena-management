export interface t_heroine_status {
    id: Number;
    heroine_id: Number;
    star: Number;
    special_weapon_level: Number;
    level: Number | null;
    rank: Number | null;
    created_date: Date;
    last_modified_date: Date;
    deleted: Boolean;
}