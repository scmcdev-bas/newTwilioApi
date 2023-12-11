const createPool = require("./db");
const sql = require("mssql");

const createSession = async (req, res) => {
  const data = req.body;
  let channel = "";
  let value = "";

  if (data.channel === "line") {
    const matchResult = data.value.match(/UID:([^ ]+)/);
    value = matchResult ? matchResult[1].toString() : "";
    channel = "3";
  } else if (data.channel === "chat") {
    const matchResult = data.value.match(/messenger:([^ ]+)/);
    value = matchResult ? matchResult[1].toString() : "";
    channel = "4";
  } else if (data.channel === "voice") {
    if (data.value.startsWith("02")) {
      const formattedString = `${data.value.slice(0, 2)}-${data.value.slice(
        2,
        5
      )}-${data.value.slice(5)}`;
      value = formattedString;
    } else {
      const formattedString = `${data.value.slice(0, 3)}-${data.value.slice(
        3,
        6
      )}-${data.value.slice(6)}`;
      value = formattedString;
    }
    channel = "1";
  }

  try {
    const pool = await createPool();
    const deleteQuery = `
    DELETE FROM [dbo].[CURRENT_SESSION]
    WHERE EMAIL_ADDR = @EMAIL_ADDR
  `;
    const deletetValues = {
      EMAIL_ADDR: data.EMAIL_ADDR,
    };

    const deletetResults = await pool
      .request()
      .input("EMAIL_ADDR", sql.VarChar, deletetValues.EMAIL_ADDR)
      .query(deleteQuery);
    console.log(deletetResults);
    const selectQuery = `
      SELECT 
        [ID],
        [USERNAME]
      FROM [dbo].[USERS] WHERE EMAIL_ADDR = @EMAIL_ADDR
    `;
    const selectValues = {
      EMAIL_ADDR: data.EMAIL_ADDR,
    };

    const selectResults = await pool
      .request()
      .input("EMAIL_ADDR", sql.VarChar, selectValues.EMAIL_ADDR)
      .query(selectQuery);

    if (!selectResults.recordset.length) {
      // Handle the case where no user is found with the given email address
      res.status(404).json({ error: "User not found." });
      return;
    }

    const USER_ID = selectResults.recordset[0].ID;
    const USER_NAME = selectResults.recordset[0].USERNAME;

    const insertQuery = `
    INSERT INTO [dbo].[CURRENT_SESSION]
    ([SESSION_ID]
    ,[CHANNEL_TYPE]
    ,[CHANNEL_VALUE]
    ,[EMAIL_ADDR]
    ,[USER_ID]
    ,[USER_NAME]
    ,[CONTACT_ID]
    ,[START_TIME])
    VALUES
    (@SESSION_ID, @CHANNEL_TYPE, @CHANNEL_VALUE, @EMAIL_ADDR, @USER_ID, @USER_NAME, @CONTACT_ID, @START_TIME)
  `;

    const insertValues = {
      SESSION_ID: data.SESSION_ID || null,
      CHANNEL_TYPE: channel || null,
      CHANNEL_VALUE: value || null,
      EMAIL_ADDR: data.EMAIL_ADDR || null, // Fixed the key name
      USER_ID: USER_ID.toString() || null,
      USER_NAME: USER_NAME.toString() || null,
      CONTACT_ID: data.CONTACT_ID || null,
      START_TIME: data.START_TIME || null,
    };

    const insertResults = await pool
      .request()
      .input("SESSION_ID", sql.VarChar, insertValues.SESSION_ID)
      .input("CHANNEL_TYPE", sql.VarChar, insertValues.CHANNEL_TYPE)
      .input("CHANNEL_VALUE", sql.VarChar, insertValues.CHANNEL_VALUE)
      .input("EMAIL_ADDR", sql.VarChar, insertValues.EMAIL_ADDR)
      .input("USER_ID", sql.VarChar, insertValues.USER_ID)
      .input("USER_NAME", sql.VarChar, insertValues.USER_NAME)
      .input("CONTACT_ID", sql.VarChar, insertValues.CONTACT_ID)
      .input("START_TIME", sql.VarChar, insertValues.START_TIME)
      .input("END_TIME", sql.VarChar, insertValues.END_TIME)
      .input("COMPLETE_TIME", sql.VarChar, insertValues.COMPLETE_TIME)
      .input("DESC", sql.VarChar, insertValues.DESC)
      .query(insertQuery);

    console.log("Data successfully inserted:", insertResults);
    res.status(200).json({ message: "Data successfully inserted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching or inserting data." });
  }
};
const updateSession = async (req, res) => {
  const data = req.body;
    console.log('updateSession')
    console.log(data)
  try {
    const pool = await createPool();
    console.log('data.END_TIME',data.END_TIME)
    console.log('data.EMAIL_ADDR',data.EMAIL_ADDR)

    const updateQuery = `
        UPDATE [dbo].[CURRENT_SESSION]
        SET [CONTACT_ID] = @CONTACT_ID,
            [END_TIME] = @END_TIME
        WHERE [EMAIL_ADDR] = @EMAIL_ADDR
      `;

    const updateValues = {
      CONTACT_ID: data.CONTACT_ID,
      END_TIME: data.END_TIME,
      EMAIL_ADDR: data.EMAIL_ADDR,
    };

    const updateResults = await pool
      .request()
      .input("CONTACT_ID", sql.Int, updateValues.CONTACT_ID)
      .input("END_TIME", sql.DateTime2, updateValues.END_TIME)
      .input("EMAIL_ADDR", sql.VarChar, updateValues.EMAIL_ADDR)
      .query(updateQuery);

    console.log(updateResults);
    res.status(200).json({ message: "Data successfully updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while updating data." });
  }
};

const deleteSession = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const deleteQuery = `
          DELETE FROM [dbo].[CURRENT_SESSION]
          WHERE EMAIL_ADDR = @EMAIL_ADDR
        `;
    const deleteValues = {
      EMAIL_ADDR: data.EMAIL_ADDR,
    };

    const deleteResults = await pool
      .request()
      .input("EMAIL_ADDR", sql.VarChar, deleteValues.EMAIL_ADDR)
      .query(deleteQuery);

    console.log(deleteResults);
    res.status(200).json({ message: "Data successfully deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while deleting data." });
  }
};

const selectAndInsertContactHistory = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const selectQuery = `
    SELECT 
        cs.[SESSION_ID],
        cs.[CHANNEL_TYPE],
        cs.[CHANNEL_VALUE],
        cs.[EMAIL_ADDR] AS SESSION_EMAIL,
        cs.[USER_ID] AS SESSION_USER_ID,
        cs.[USER_NAME] AS SESSION_USER_NAME,
        cs.[CONTACT_ID],
        cs.[START_TIME],
        cs.[END_TIME],
        cs.[COMPLETE_TIME],
        cs.[DESC],
        u.[USERNAME]
    FROM 
        [scmc-POC].[dbo].[CURRENT_SESSION] cs
    INNER JOIN 
        [scmc-POC].[dbo].[USERS] u ON cs.[EMAIL_ADDR] = u.[EMAIL_ADDR]
    WHERE cs.EMAIL_ADDR = @EMAIL_ADDR
`;
    const selectValues = {
      EMAIL_ADDR: data.EMAIL_ADDR,
    };
    const selectResults = await pool
      .request()
      .input("EMAIL_ADDR", sql.VarChar, selectValues.EMAIL_ADDR)
      .query(selectQuery);

    if (selectResults.recordset.length === 1) {
      const row = selectResults.recordset[0];
      console.log(row);
      const contactHistoryInsertQuery = `
          INSERT INTO [dbo].[CONTACT_HISTORY]
          ([SESSION_ID]
          ,[CHANNEL_TYPE]
          ,[CHANNEL_VALUE]
          ,[DESC]
          ,[AGENT]
          ,[EMAIL_ADDR]
          ,[START_TIME]
          ,[END_TIME]
          ,[COMPLETE_TIME]
          ,[REMARK]
          ,[CONTACT_ID])
          VALUES
          (@SESSION_ID
          ,@CHANNEL_TYPE
          ,@CHANNEL_VALUE
          ,@DESC
          ,@AGENT
          ,@EMAIL_ADDR
          ,@START_TIME
          ,@END_TIME
          ,@COMPLETE_TIME
          ,@REMARK
          ,@CONTACT_ID)
        `;

      const insertValues = {
        SESSION_ID: row.SESSION_ID,
        CHANNEL_TYPE: row.CHANNEL_TYPE,
        CHANNEL_VALUE: row.CHANNEL_VALUE,
        DESC: row.DESC,
        AGENT: row.SESSION_USER_NAME,
        EMAIL_ADDR: row.SESSION_EMAIL,
        START_TIME: row.START_TIME,
        END_TIME: data.COMPLETE_TIME,
        COMPLETE_TIME: data.COMPLETE_TIME,
        REMARK: row.REMARK,
        CONTACT_ID: row.SESSION_USER_ID,
      };

      await pool
        .request()
        .input("SESSION_ID", sql.NVarChar, insertValues.SESSION_ID)
        .input("CHANNEL_TYPE", sql.Int, insertValues.CHANNEL_TYPE)
        .input("CHANNEL_VALUE", sql.NVarChar, insertValues.CHANNEL_VALUE)
        .input("DESC", sql.NVarChar, insertValues.DESC)
        .input("AGENT", sql.NVarChar, insertValues.AGENT)
        .input("EMAIL_ADDR", sql.NVarChar, insertValues.EMAIL_ADDR)
        .input("START_TIME", sql.DateTime2, insertValues.START_TIME)
        .input("END_TIME", sql.DateTime2, insertValues.END_TIME)
        .input("COMPLETE_TIME", sql.DateTime2, insertValues.COMPLETE_TIME)
        .input("REMARK", sql.NVarChar, insertValues.REMARK)
        .input("CONTACT_ID", sql.Int, insertValues.CONTACT_ID)
        .query(contactHistoryInsertQuery);

      res.status(200).json({
        message:
          "Data successfully selected and inserted into CONTACT_HISTORY.",
      });
    } else {
      res
        .status(404)
        .json({ message: "No data found for the specified email address." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching or inserting data." });
  }
};

module.exports = {
  createSession,
  updateSession,
  deleteSession,
  selectAndInsertContactHistory,
};
