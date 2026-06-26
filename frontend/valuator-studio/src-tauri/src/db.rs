use rusqlite::{params, Connection, Result};

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
        [],
    )?;
    Ok(())
}

pub fn set_kv_db(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO kv (k, v) VALUES (?1, ?2) ON CONFLICT(k) DO UPDATE SET v=excluded.v",
        params![key, value],
    )?;
    Ok(())
}

pub fn get_kv_db(conn: &Connection, key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT v FROM kv WHERE k = ?1")?;
    let mut rows = stmt.query(params![key])?;
    if let Some(row) = rows.next()? {
        let v: String = row.get(0)?;
        Ok(Some(v))
    } else {
        Ok(None)
    }
}

pub fn delete_kv_db(conn: &Connection, key: &str) -> Result<()> {
    conn.execute("DELETE FROM kv WHERE k = ?1", params![key])?;
    Ok(())
}

pub fn list_keys_db(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT k FROM kv")?;
    let mut rows = stmt.query([])?;
    let mut keys = Vec::new();
    while let Some(row) = rows.next()? {
        let k: String = row.get(0)?;
        keys.push(k);
    }
    Ok(keys)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_kv_crud_and_list() {
        let conn = Connection::open_in_memory().expect("open in-memory");
        init_db(&conn).expect("init");

        // set
        set_kv_db(&conn, "a", "1").expect("set");
        set_kv_db(&conn, "b", "2").expect("set");

        // get
        let a = get_kv_db(&conn, "a").expect("get");
        assert_eq!(a.as_deref(), Some("1"));

        // list
        let mut keys = list_keys_db(&conn).expect("list");
        keys.sort();
        assert_eq!(keys, vec!["a".to_string(), "b".to_string()]);

        // delete
        delete_kv_db(&conn, "a").expect("delete");
        assert_eq!(get_kv_db(&conn, "a").expect("get after delete"), None);
    }
}
