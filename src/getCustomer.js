const createPool = require("./db");
const moment = require("moment");
const sql = require("mssql");

const getCustomer = async (req, res) => {
  const data = req.body;
  console.log(data);

  let channel = "";
  let value = "";

  
  try {
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
  
    console.log("value", value);
  
    const pool = await createPool();
    const selectQuery = `
      SELECT 
        cca.[ID] AS AccountID,
        cca.[CUSTOMER_ID],
        ccc.CONTACT_ID
      FROM 
        [CUSTOMER_CONTACT_CHANNEL] ccc
      INNER JOIN 
        [CUSTOMER_CONTACT_ACCOUNT] cca 
      ON 
        ccc.[CONTACT_ID] = cca.[CONTACT_ID]
      WHERE 
        ccc.[CHANNEL_TYPE] = @CHANNEL 
        AND ccc.[CHANNEL_VALUE] =  @LINE_USER_ID
    `;

    const selectValues = {
      CHANNEL: channel,
      LINE_USER_ID: value,
    };
    console.log(selectValues);
    const selectResults = await pool
      .request()
      .input("CHANNEL", sql.VarChar, selectValues.CHANNEL)
      .input("LINE_USER_ID", sql.VarChar, selectValues.LINE_USER_ID)
      .query(selectQuery);

    if (selectResults.recordset.length > 0) {
      // Log the results
      console.log(selectResults.recordset[0].CUSTOMER_ID);
      // Send the results as a response
      res.status(200).json({ CUSTOMER_ID: selectResults.recordset[0].CUSTOMER_ID,CONTACT_ID: selectResults.recordset[0].CONTACT_ID  });
    } else {
      res
        .status(200)
        .json({result : 0, message: "No customer found for the given criteria." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching data." });
  }
};

const createCustomer = async (req, res) => {
  console.log('createCustomer')
  const data = req.body;
  console.log(data);

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
      const formattedString = `${data.value.slice(0, 2)}-${data.value.slice(2, 5)}-${data.value.slice(5)}`;
      value = formattedString;
    } else {
      const formattedString = `${data.value.slice(0, 3)}-${data.value.slice(3, 6)}-${data.value.slice(6)}`;
      value = formattedString;
    }
    channel = "1";
  }

  console.log("value", data);
  let customerID = "";
  let customerContactID = "";
  let customerContactChannel = "";
  let customerContactAccount = "";
  try {
    const pool = await createPool();

    // Insert into CUSTOMER_ACCOUNT
    const insertAccountValues = {
      GROUP_ID: "",
      CODE: "N/A",
      NAME: "N/A",
      CUST_TYPE: "1",
      CUST_LEVEL: "3",
      TYPE_OF_BIZ: "",
      INDUSTRY: "",
      DATE_OF_BIRTH: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      GENDER: "",
      STATUS: "Y",
      CREATED_BY: "Twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      UPDATED_BY: "Twilio",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      CUSTOMER_ID_OLD: "",
      EMAIL_NAME: "",
    };

    customerID = await insertCustomerAccount(pool, insertAccountValues, data);

    // Insert into CUSTOMER_CONTACT
    const insertContactValues = {
      TITLE: "0",
      FIRST_NAME: "N/A",
      LAST_NAME: "N/A",
      STATUS: "Y",
      CREATED_BY: "Twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      UPDATED_BY: "Twilio",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      CUSTOMER_ID_OLD: "",
    };

    customerContactID = await insertCustomerContact(pool, insertContactValues);

    // Insert into CUSTOMER_CONTACT_CHANNEL
    const insertChannelValues = {
      CONTACT_ID: customerContactID,
      CHANNEL_TYPE: channel,
      CHANNEL_VALUE: value,
      IS_PRIMARY: "Y",
      CREATED_BY: "Twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      UPDATED_BY: "Twilio",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
    };

    customerContactChannel = await insertCustomerContactChannel(pool, insertChannelValues);

    // Insert into CUSTOMER_CONTACT_ACCOUNT
    const insertAccount = {
      CONTACT_ID: customerContactID.toString(),
      CUSTOMER_ID: customerID.toString(),
      IS_PRIMARY: "Y",
      CREATED_BY: "Twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      UPDATED_BY: "Twilio",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
    };
    customerContactAccount = await insertCustomerContactAccount(pool, insertAccount);
    console.log("test",
      customerID,
      customerContactID,
      customerContactChannel,
      customerContactAccount,)
    res.status(200).json({
      success: true,
      customerID,
      customerContactID,
      customerContactChannel,
      customerContactAccount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while inserting data." });
  } finally {
    sql.close();
  }
};

const insertCustomerAccount = async (pool, values, data) => {
  const insertAccountQuery = `
    INSERT INTO [dbo].[CUSTOMER_ACCOUNT]
    ([GROUP_ID], [CODE], [NAME], [CUST_TYPE], [CUST_LEVEL], [TYPE_OF_BIZ], 
    [INDUSTRY], [DATE_OF_BIRTH], [GENDER], [STATUS], [CREATED_BY], 
    [CREATED_AT], [UPDATED_BY], [UPDATED_AT], [CUSTOMER_ID_OLD], [EMAIL_NAME])
    OUTPUT INSERTED.ID
    VALUES
    (@GROUP_ID, @CODE, @NAME, @CUST_TYPE, @CUST_LEVEL, @TYPE_OF_BIZ, 
    @INDUSTRY, @DATE_OF_BIRTH, @GENDER, @STATUS, @CREATED_BY, 
    @CREATED_AT, @UPDATED_BY, @UPDATED_AT, @CUSTOMER_ID_OLD, @EMAIL_NAME);
  `;

  const result = await pool
    .request()
    .input("GROUP_ID", sql.Int, values.GROUP_ID)
    .input("CODE", sql.NVarChar(50), values.CODE)
    .input("NAME", sql.NVarChar(300), values.NAME)
    .input("CUST_TYPE", sql.NVarChar(5), values.CUST_TYPE)
    .input("CUST_LEVEL", sql.NVarChar(5), values.CUST_LEVEL)
    .input("TYPE_OF_BIZ", sql.NVarChar(5), values.TYPE_OF_BIZ)
    .input("INDUSTRY", sql.NVarChar(5), values.INDUSTRY)
    .input("DATE_OF_BIRTH", sql.Date, values.DATE_OF_BIRTH)
    .input("GENDER", sql.NVarChar(1), values.GENDER)
    .input("STATUS", sql.NVarChar(1), values.STATUS)
    .input("CREATED_BY", sql.NVarChar(20), values.CREATED_BY)
    .input("CREATED_AT", sql.DateTime, values.CREATED_AT)
    .input("UPDATED_BY", sql.NVarChar(20), values.UPDATED_BY)
    .input("UPDATED_AT", sql.DateTime, values.UPDATED_AT)
    .input("CUSTOMER_ID_OLD", sql.Int, values.CUSTOMER_ID_OLD)
    .input("EMAIL_NAME", sql.NVarChar(100), values.EMAIL_NAME)
    .input("CHANNEL", sql.VarChar, data.CHANNEL)
    .input("LINE_USER_ID", sql.VarChar, data.LINE_USER_ID)
    .query(insertAccountQuery);

  return result.recordset[0].ID;
};

const insertCustomerContact = async (pool, values) => {
  const insertContactQuery = `
    INSERT INTO [dbo].[CUSTOMER_CONTACT]
    ([TITLE], [FIRST_NAME], [LAST_NAME], [STATUS], [CREATED_BY], 
    [CREATED_AT], [UPDATED_BY], [UPDATED_AT], [CUSTOMER_ID_OLD])
    OUTPUT INSERTED.ID
    VALUES
    (@TITLE, @FIRST_NAME, @LAST_NAME, @STATUS, @CREATED_BY, 
    @CREATED_AT, @UPDATED_BY, @UPDATED_AT, @CUSTOMER_ID_OLD);
  `;

  const result = await pool
    .request()
    .input("TITLE", sql.NVarChar(5), values.TITLE)
    .input("FIRST_NAME", sql.NVarChar(100), values.FIRST_NAME)
    .input("LAST_NAME", sql.NVarChar(100), values.LAST_NAME)
    .input("STATUS", sql.NVarChar(1), values.STATUS)
    .input("CREATED_BY", sql.NVarChar(20), values.CREATED_BY)
    .input("CREATED_AT", sql.DateTime, values.CREATED_AT)
    .input("UPDATED_BY", sql.NVarChar(20), values.UPDATED_BY)
    .input("UPDATED_AT", sql.DateTime, values.UPDATED_AT)
    .input("CUSTOMER_ID_OLD", sql.Int, values.CUSTOMER_ID_OLD)
    .query(insertContactQuery);

  return result.recordset[0].ID;
};

const insertCustomerContactChannel = async (pool, values) => {
  const insertChannelQuery = `
    INSERT INTO [dbo].[CUSTOMER_CONTACT_CHANNEL]
    ([CONTACT_ID], [CHANNEL_TYPE], [CHANNEL_VALUE], [IS_PRIMARY], 
    [CREATED_BY], [CREATED_AT], [UPDATED_BY], [UPDATED_AT])
    OUTPUT INSERTED.ID
    VALUES
    (@CONTACT_ID, @CHANNEL_TYPE, @CHANNEL_VALUE, @IS_PRIMARY, @CREATED_BY, 
    @CREATED_AT, @UPDATED_BY, @UPDATED_AT);
  `;

  const result = await pool
    .request()
    .input("CONTACT_ID", sql.Int, values.CONTACT_ID)
    .input("CHANNEL_TYPE", sql.VarChar, values.CHANNEL_TYPE)
    .input("CHANNEL_VALUE", sql.VarChar, values.CHANNEL_VALUE)
    .input("IS_PRIMARY", sql.NVarChar(1), values.IS_PRIMARY)
    .input("CREATED_BY", sql.NVarChar(20), values.CREATED_BY)
    .input("CREATED_AT", sql.DateTime, values.CREATED_AT)
    .input("UPDATED_BY", sql.NVarChar(20), values.UPDATED_BY)
    .input("UPDATED_AT", sql.DateTime, values.UPDATED_AT)
    .query(insertChannelQuery);

  return result.recordset[0].ID;
};
const insertCustomerContactAccount = async (pool, values) => {
  const insertChannelQuery = `
    INSERT INTO [dbo].[CUSTOMER_CONTACT_ACCOUNT]
    ([CONTACT_ID]
    ,[CUSTOMER_ID]
    ,[IS_PRIMARY]
    ,[CREATED_BY]
    ,[CREATED_AT]
    ,[UPDATED_BY]
    ,[UPDATED_AT])
      OUTPUT INSERTED.ID
      VALUES
      (@CONTACT_ID, @CUSTOMER_ID, @IS_PRIMARY,  @CREATED_BY, 
      @CREATED_AT, @UPDATED_BY, @UPDATED_AT);
  `;

  const result = await pool
    .request()
    .input("CONTACT_ID", sql.Int, values.CONTACT_ID)
    .input("CUSTOMER_ID", sql.VarChar, values.CUSTOMER_ID)
    .input("IS_PRIMARY", sql.VarChar, values.IS_PRIMARY)
    .input("CREATED_BY", sql.NVarChar(20), values.CREATED_BY)
    .input("CREATED_AT", sql.DateTime, values.CREATED_AT)
    .input("UPDATED_BY", sql.NVarChar(20), values.UPDATED_BY)
    .input("UPDATED_AT", sql.DateTime, values.UPDATED_AT)
    .query(insertChannelQuery);

  return result.recordset[0].ID;
};

module.exports = {
  getCustomer,
  createCustomer,
};
