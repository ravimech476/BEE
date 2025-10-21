-- Check if SequelizeMeta table exists and what migrations have been run
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SequelizeMeta')
BEGIN
    SELECT * FROM SequelizeMeta;
END
ELSE
BEGIN
    PRINT 'SequelizeMeta table does not exist. Creating it now...';
    CREATE TABLE SequelizeMeta (
        name NVARCHAR(255) NOT NULL PRIMARY KEY
    );
END

-- Mark old migrations as already run if they haven't been tracked
IF NOT EXISTS (SELECT * FROM SequelizeMeta WHERE name = '20250725000001-create-tables.js')
BEGIN
    INSERT INTO SequelizeMeta (name) VALUES ('20250725000001-create-tables.js');
END

IF NOT EXISTS (SELECT * FROM SequelizeMeta WHERE name = '20250725000002-update-users.js')
BEGIN
    INSERT INTO SequelizeMeta (name) VALUES ('20250725000002-update-users.js');
END

IF NOT EXISTS (SELECT * FROM SequelizeMeta WHERE name = '20250725000003-add-timestamps.js')
BEGIN
    INSERT INTO SequelizeMeta (name) VALUES ('20250725000003-add-timestamps.js');
END

PRINT 'Migration tracking updated!';
