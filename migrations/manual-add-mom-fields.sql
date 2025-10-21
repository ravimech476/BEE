-- Run this SQL script to add the new columns to tbl_meeting_minutes table

-- Add mom_number column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_meeting_minutes]') AND name = 'mom_number')
BEGIN
    ALTER TABLE [dbo].[tbl_meeting_minutes] 
    ADD [mom_number] NVARCHAR(50) NULL;
    
    -- Update existing records with a generated MOM number
    UPDATE [dbo].[tbl_meeting_minutes] 
    SET [mom_number] = CONCAT('MOM-', YEAR(meeting_date), '-', FORMAT(id, '000'))
    WHERE [mom_number] IS NULL;
    
    -- Make the column NOT NULL and add unique constraint
    ALTER TABLE [dbo].[tbl_meeting_minutes] 
    ALTER COLUMN [mom_number] NVARCHAR(50) NOT NULL;
    
    ALTER TABLE [dbo].[tbl_meeting_minutes]
    ADD CONSTRAINT UC_mom_number UNIQUE ([mom_number]);
END

-- Add attachments column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_meeting_minutes]') AND name = 'attachments')
BEGIN
    ALTER TABLE [dbo].[tbl_meeting_minutes] 
    ADD [attachments] NVARCHAR(MAX) NULL DEFAULT '[]';
END

PRINT 'Migration completed successfully!';
