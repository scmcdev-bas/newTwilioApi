const createPool = require("./db");
const moment = require("moment");
const sql = require("mssql");

const lineCallStamp = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const selectQuery = `
       SELECT [CUSTOMER_ID]
       FROM [dbo].[V_CUSTOMER_CONTACT_DETAIL]
       WHERE LINE_ID = @LINE_USER_ID
    `;
    const selectValues = {
      LINE_USER_ID: "U0b85187616f1cf32f1197c09c1987ec1",
    };

    const selectResults = await pool
      .request()
      .input("LINE_USER_ID", sql.VarChar, selectValues.LINE_USER_ID)
      .query(selectQuery);

    const customerID = selectResults.recordset[0].CUSTOMER_ID;
    console.log("Data successfully fetched:", customerID);

    // Use the fetched CUSTOMER_ID in the INSERT operation
    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss.SSS");

    const insertQuery = `
        INSERT INTO [dbo].[ACTIVITY_HISTORY]
        ([CUSTOMER_ID], [ACTIVITY_ID], [SUBJECT], [DETAIL], [SOURCE], [ACTIVITY_BY], [ACTIVITY_AT],
         [CUSTOMER_ID_OLD], [VALUE], [LINE_USER_ID])
        VALUES
        (@CUSTOMER_ID, @ACTIVITY_ID, @SUBJECT, @DETAIL, @SOURCE, @ACTIVITY_BY, @ACTIVITY_AT,
         @CUSTOMER_ID_OLD, @VALUE, @LINE_USER_ID)
    `;

    const insertValues = {
      CUSTOMER_ID: customerID.toString(),
      ACTIVITY_ID: "18",
      SUBJECT: data.SUBJECT || null,
      DETAIL: "incoming LINE message",
      SOURCE: data.SOURCE,
      ACTIVITY_BY: "twilio",
      ACTIVITY_AT: currentDate,
      CUSTOMER_ID_OLD: data.CUSTOMER_ID_OLD || null,
      VALUE: data.VALUE || null,
      LINE_USER_ID: data.LINE_USER_ID || null,
    };

    const insertResults = await pool
      .request()
      .input("CUSTOMER_ID", sql.VarChar, insertValues.CUSTOMER_ID)
      .input("ACTIVITY_ID", sql.VarChar, insertValues.ACTIVITY_ID)
      .input("SUBJECT", sql.VarChar, insertValues.SUBJECT)
      .input("DETAIL", sql.VarChar, insertValues.DETAIL)
      .input("SOURCE", sql.VarChar, insertValues.SOURCE)
      .input("ACTIVITY_BY", sql.VarChar, insertValues.ACTIVITY_BY)
      .input("ACTIVITY_AT", sql.VarChar, insertValues.ACTIVITY_AT)
      .input("CUSTOMER_ID_OLD", sql.VarChar, insertValues.CUSTOMER_ID_OLD)
      .input("VALUE", sql.VarChar, insertValues.VALUE)
      .input("LINE_USER_ID", sql.VarChar, insertValues.LINE_USER_ID)
      .query(insertQuery);

    console.log("Data successfully inserted:", insertResults);
    res.status(200).json({ message: "Data successfully inserted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching or inserting data." });
  }
};

const callStamp = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const selectQuery = `
       SELECT [CUSTOMER_ID],[PHONE_NUMBER_FORMAT]
       FROM [dbo].[V_CUSTOMER_CONTACT_DETAIL]
       WHERE [PHONE_NUMBER] = @PHONE_NUMBER
    `;
    const selectValues = {
      PHONE_NUMBER: req.body.PHONE_NUMBER,
    };

    const selectResults = await pool
      .request()
      .input("PHONE_NUMBER", sql.VarChar, selectValues.PHONE_NUMBER)
      .query(selectQuery);
    let callType = "";
    if (data.CALL_RESULT == "Yes") {
      callType = "12";
    } else {
      callType = "13";
    }
    const customerID = selectResults.recordset[0].CUSTOMER_ID;
    const phoneNumberFormat = selectResults.recordset[0].PHONE_NUMBER_FORMAT;

    console.log("Data successfully fetched:", customerID);

    // Use the fetched CUSTOMER_ID in the INSERT operation
    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss.SSS");

    const insertQuery = `
        INSERT INTO [dbo].[ACTIVITY_HISTORY]
        ([CUSTOMER_ID], [ACTIVITY_ID], [SUBJECT], [DETAIL], [SOURCE], [ACTIVITY_BY], [ACTIVITY_AT],
         [CUSTOMER_ID_OLD], [VALUE], [LINE_USER_ID])
        VALUES
        (@CUSTOMER_ID, @ACTIVITY_ID, @SUBJECT, @DETAIL, @SOURCE, @ACTIVITY_BY, @ACTIVITY_AT,
         @CUSTOMER_ID_OLD, @VALUE, @LINE_USER_ID)
    `;

    const insertValues = {
      CUSTOMER_ID: customerID.toString(),
      ACTIVITY_ID: "12",
      SUBJECT: data.SUBJECT || null,
      DETAIL: "Inbound call",
      SOURCE: data.SOURCE,
      ACTIVITY_BY: "twilio",
      ACTIVITY_AT: currentDate,
      CUSTOMER_ID_OLD: data.CUSTOMER_ID_OLD || null,
      VALUE: phoneNumberFormat,
      LINE_USER_ID: null,
    };

    const insertResults = await pool
      .request()
      .input("CUSTOMER_ID", sql.VarChar, insertValues.CUSTOMER_ID)
      .input("ACTIVITY_ID", sql.VarChar, insertValues.ACTIVITY_ID)
      .input("SUBJECT", sql.VarChar, insertValues.SUBJECT)
      .input("DETAIL", sql.VarChar, insertValues.DETAIL)
      .input("SOURCE", sql.VarChar, insertValues.SOURCE)
      .input("ACTIVITY_BY", sql.VarChar, insertValues.ACTIVITY_BY)
      .input("ACTIVITY_AT", sql.VarChar, insertValues.ACTIVITY_AT)
      .input("CUSTOMER_ID_OLD", sql.VarChar, insertValues.CUSTOMER_ID_OLD)
      .input("VALUE", sql.VarChar, insertValues.VALUE)
      .input("LINE_USER_ID", sql.VarChar, insertValues.LINE_USER_ID)
      .query(insertQuery);

    console.log("Data successfully inserted:", insertResults);
    res.status(200).json({ message: "Data successfully inserted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching or inserting data." });
  }
};
const messengerStamp = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const selectQuery = `
       SELECT [CUSTOMER_ID],[PHONE_NUMBER_FORMAT]
       FROM [dbo].[V_CUSTOMER_CONTACT_DETAIL]
       WHERE [FACEBOOK_ID] = @FACEBOOK_ID
    `;
    const selectValues = {
      FACEBOOK_ID: data.FACEBOOK_ID,
    };

    const selectResults = await pool
      .request()
      .input("PHONE_NUMBER", sql.VarChar, selectValues.PHONE_NUMBER)
      .query(selectQuery);
    const customerID = selectResults.recordset[0].CUSTOMER_ID;
    const FACEBOOK_ID = selectResults.recordset[0].FACEBOOK_ID;

    console.log("Data successfully fetched:", customerID);

    // Use the fetched CUSTOMER_ID in the INSERT operation
    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss.SSS");

    const insertQuery = `
        INSERT INTO [dbo].[ACTIVITY_HISTORY]
        ([CUSTOMER_ID], [ACTIVITY_ID], [SUBJECT], [DETAIL], [SOURCE], [ACTIVITY_BY], [ACTIVITY_AT],
         [CUSTOMER_ID_OLD], [VALUE], [LINE_USER_ID])
        VALUES
        (@CUSTOMER_ID, @ACTIVITY_ID, @SUBJECT, @DETAIL, @SOURCE, @ACTIVITY_BY, @ACTIVITY_AT,
         @CUSTOMER_ID_OLD, @VALUE, @LINE_USER_ID)
    `;

    const insertValues = {
      CUSTOMER_ID: customerID.toString(),
      ACTIVITY_ID: "12",
      SUBJECT: data.SUBJECT || null,
      DETAIL: "Inbound call",
      SOURCE: data.SOURCE,
      ACTIVITY_BY: "twilio",
      ACTIVITY_AT: currentDate,
      CUSTOMER_ID_OLD: data.CUSTOMER_ID_OLD || null,
      VALUE: phoneNumberFormat,
      LINE_USER_ID: data.LINE_USER_ID || null,
    };

    const insertResults = await pool
      .request()
      .input("CUSTOMER_ID", sql.VarChar, insertValues.CUSTOMER_ID)
      .input("ACTIVITY_ID", sql.VarChar, insertValues.ACTIVITY_ID)
      .input("SUBJECT", sql.VarChar, insertValues.SUBJECT)
      .input("DETAIL", sql.VarChar, insertValues.DETAIL)
      .input("SOURCE", sql.VarChar, insertValues.SOURCE)
      .input("ACTIVITY_BY", sql.VarChar, insertValues.ACTIVITY_BY)
      .input("ACTIVITY_AT", sql.VarChar, insertValues.ACTIVITY_AT)
      .input("CUSTOMER_ID_OLD", sql.VarChar, insertValues.CUSTOMER_ID_OLD)
      .input("VALUE", sql.VarChar, insertValues.VALUE)
      .input("LINE_USER_ID", sql.VarChar, insertValues.LINE_USER_ID)
      .query(insertQuery);

    console.log("Data successfully inserted:", insertResults);
    res.status(200).json({ message: "Data successfully inserted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching or inserting data." });
  }
};

module.exports = {
  lineCallStamp,
  callStamp,
  messengerStamp,
};
