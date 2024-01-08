const createPool = require("./db");
const moment = require("moment");
const sql = require("mssql");

const updateContact = async (req, res) => {
  const data = req.body;
  console.log(data);
  console.log("work");

  try {
    const pool = await createPool();

    // Update [dbo].[CUSTOMER_CONTACT_CHANNEL] table
    const updateChannelQuery = `
      UPDATE [dbo].[CUSTOMER_CONTACT_CHANNEL]
      SET 
          [CHANNEL_TYPE] = @CHANNEL_TYPE,
          [CHANNEL_VALUE] = @CHANNEL_VALUE,
          [CREATED_AT] = @CREATED_AT,
          [UPDATED_AT] = @UPDATED_AT
      WHERE [CONTACT_ID] = @CONTACT_ID`;

    const updateChannelValues = {
      CHANNEL_TYPE: data.channelType,
      CHANNEL_VALUE: data.channelValue,
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      CONTACT_ID: data.custId.toString(),
    };

    const updateChannelResults = await pool
      .request()
      .input("CHANNEL_TYPE", sql.VarChar, updateChannelValues.CHANNEL_TYPE)
      .input("CHANNEL_VALUE", sql.VarChar, updateChannelValues.CHANNEL_VALUE)
      .input("CREATED_AT", sql.DateTime2, updateChannelValues.CREATED_AT)
      .input("UPDATED_AT", sql.DateTime2, updateChannelValues.UPDATED_AT)
      .input("CONTACT_ID", sql.VarChar, updateChannelValues.CONTACT_ID)
      .query(updateChannelQuery);

    // Check if any rows were affected in [dbo].[CUSTOMER_CONTACT_CHANNEL] table
    if (updateChannelResults.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No contact found for the given criteria." });
    }
    const updateContactQuery = `
    UPDATE [dbo].[CUSTOMER_CONTACT]
SET 
[TITLE] = @TITLE,
[FIRST_NAME] = @FIRST_NAME,
[LAST_NAME] = @LAST_NAME,
[UPDATED_AT] = @UPDATED_AT
WHERE ID = @CONTACT_ID`;

    const updateContactValues = {
      TITLE: data.titleName,
      FIRST_NAME: data.firstName,
      LAST_NAME: data.lastName,
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      CONTACT_ID: data.custId.toString(),
    };

    const updateContactResults = await pool
      .request()
      .input("TITLE", sql.VarChar, updateContactValues.TITLE)
      .input("FIRST_NAME", sql.VarChar, updateContactValues.FIRST_NAME)
      .input("LAST_NAME", sql.VarChar, updateContactValues.LAST_NAME)
      .input("UPDATED_AT", sql.DateTime2, updateContactValues.UPDATED_AT)
      .input("CONTACT_ID", sql.VarChar, updateContactValues.CONTACT_ID)
      .query(updateContactQuery);

    // Update [dbo].[CUSTOMER_CONTACT_ACCOUNT] table if custPrimary is truthy
    if (data.custPrimary[0]) {
      // Update [IS_PRIMARY] to 'N' for other contacts of the same customer
      const updateAccountQuery = `
        UPDATE [dbo].[CUSTOMER_CONTACT_ACCOUNT]
        SET 
          [IS_PRIMARY] = 'N'
        WHERE [CUSTOMER_ID] = @custId`;

      const updateAccountValuesN = {
        CUSTOMER_ID: data.custPrimary[0].custId.toString(),
      };

      const updateAccountResultsN = await pool
        .request()
        .input("custId", sql.VarChar, updateAccountValuesN.CUSTOMER_ID)
        .query(updateAccountQuery);

      // Check if any rows were affected in [dbo].[CUSTOMER_CONTACT_ACCOUNT] table
      if (updateAccountResultsN.rowsAffected[0] === 0) {
        return res
          .status(404)
          .json({ error: "No contact found for the given criteria." });
      }

      // Update [IS_PRIMARY] to 'Y' for the specified contact
      const updateAccountQueryY = `
        UPDATE [dbo].[CUSTOMER_CONTACT_ACCOUNT]
        SET 
          [IS_PRIMARY] = 'Y'
        WHERE [CUSTOMER_ID] = @custId AND [CONTACT_ID] = @contactId`;

      const updateAccountValuesY = {
        CUSTOMER_ID: data.custPrimary[0].custId.toString(),
        contactId: data.custId.toString(),
      };

      const updateAccountResultsY = await pool
        .request()
        .input("custId", sql.VarChar, updateAccountValuesY.CUSTOMER_ID)
        .input("contactId", sql.VarChar, updateAccountValuesY.contactId)
        .query(updateAccountQueryY);

      // Check if any rows were affected in [dbo].[CUSTOMER_CONTACT_ACCOUNT] table
      if (updateAccountResultsY.rowsAffected[0] === 0) {
        return res
          .status(404)
          .json({ error: "No contact found for the given criteria." });
      }
    }
    if (data.newCusPrimary === "Y") {
      const updateAccountQuery = `
        UPDATE [dbo].[CUSTOMER_ACCOUNT]
        SET 
        [NAME] = @NAME
        WHERE [ID] = @custId`;

      const updateAccountValuesN = {
        CUSTOMER_ID: data.custName.toString(),
        NAME: data.firstName + " " + data.lastName,
      };

      await pool
        .request()
        .input("custId", sql.VarChar, updateAccountValuesN.CUSTOMER_ID)
        .input("NAME", sql.VarChar, updateAccountValuesN.NAME)

        .query(updateAccountQuery);
    }
    // If reached here, both updates were successful
    res.status(200).json({ message: "Contact updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while updating contact." });
  }
};

const getContact = async (req, res) => {
  const data = req.body;
  console.log(data);
  console.log("work");

  try {
    const pool = await createPool(); // Assuming createPool is implemented and imported

    // Update [dbo].[CUSTOMER_CONTACT_CHANNEL] table
    const selectQuery = `
      SELECT 
    CCO.[ID] AS ContactID,
    CCO.[TITLE],
    LKPT.[DESC_TH] AS TitleDescription,
    CCO.[FIRST_NAME],
    CCO.[LAST_NAME],
    CCO.[STATUS],
    CCC.[CONTACT_ID],
    LKPC.[DESC_TH] AS CHANNEL_TYPE,
    CCC.[CHANNEL_VALUE],
    CCC.[IS_PRIMARY],
    CCA.[CUSTOMER_ID],
    CCA.[IS_PRIMARY] AS ACCOUNT_IS_PRIMARY
FROM 
    [CUSTOMER_CONTACT_CHANNEL] CCC
JOIN 
    [CUSTOMER_CONTACT] CCO ON CCC.[CONTACT_ID] = CCO.[ID]
JOIN
    [LOOKUP] LKPT ON CCO.[TITLE] = LKPT.[LOOKUP_CODE]
JOIN
    [LOOKUP] LKPC ON CCC.[CHANNEL_TYPE] = LKPC.[LOOKUP_CODE]
JOIN
    [CUSTOMER_CONTACT_ACCOUNT] CCA ON CCC.[CONTACT_ID] = CCA.[CONTACT_ID]
WHERE
    LKPT.[LOOKUP_TYPE] = 'TITLE_NAME'
    AND LKPC.[LOOKUP_TYPE] = 'CHANNEL'
    AND CCA.[CUSTOMER_ID] = @custId
ORDER BY 
    CASE 
        WHEN CCC.[IS_PRIMARY] = 'Y' THEN 0
        ELSE 1
    END,
    CCC.[ID] DESC;

      `;

    const selectResults = await pool
      .request()
      .input("custId", sql.VarChar, data.customerId.toString()) // Use data.customerId directly
      .query(selectQuery);

    // console.log(selectResults);
    res.status(200).json({
      message: "Contact retrieved successfully.",
      data: selectResults.recordset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while retrieving contact." });
  }
};

const createContact = async (req, res) => {
  const data = req.body;
  console.log(data);
  console.log("work");

  try {
    const pool = await createPool();

    // Insert into [dbo].[CUSTOMER_CONTACT] table
    const insertContactQuery = `
      INSERT INTO [dbo].[CUSTOMER_CONTACT]
        ([TITLE]
        ,[FIRST_NAME]
        ,[LAST_NAME]
        ,[STATUS]
        ,[CREATED_BY]
        ,[CREATED_AT]
        ,[UPDATED_BY]
        ,[UPDATED_AT]
        ,[CUSTOMER_ID_OLD]
        ,[LINE_ID])
      OUTPUT INSERTED.ID
      VALUES
        (@TITLE
        ,@FIRST_NAME
        ,@LAST_NAME
        ,@STATUS
        ,@CREATED_BY
        ,@CREATED_AT
        ,@UPDATED_BY
        ,@UPDATED_AT
        ,@CUSTOMER_ID_OLD
        ,@LINE_ID);
    `;

    const insertContactValues = {
      TITLE: data.title,
      FIRST_NAME: data.firstName,
      LAST_NAME: data.lastName,
      STATUS: data.status,
      CREATED_BY: "twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      UPDATED_BY: "twilio POC",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      CUSTOMER_ID_OLD: null,
      LINE_ID: null,
    };

    // Execute the INSERT query for CUSTOMER_CONTACT
    const insertContactRequest = await pool
      .request()
      .input("TITLE", sql.NVarChar, insertContactValues.TITLE)
      .input("FIRST_NAME", sql.NVarChar, insertContactValues.FIRST_NAME)
      .input("LAST_NAME", sql.NVarChar, insertContactValues.LAST_NAME)
      .input("STATUS", sql.NVarChar, insertContactValues.STATUS)
      .input("CREATED_BY", sql.NVarChar, insertContactValues.CREATED_BY)
      .input("CREATED_AT", sql.DateTime, insertContactValues.CREATED_AT)
      .input("UPDATED_BY", sql.NVarChar, insertContactValues.UPDATED_BY)
      .input("UPDATED_AT", sql.DateTime, insertContactValues.UPDATED_AT)
      .input("CUSTOMER_ID_OLD", sql.Int, insertContactValues.CUSTOMER_ID_OLD)
      .input("LINE_ID", sql.VarChar, insertContactValues.LINE_ID)
      .query(insertContactQuery);

    // Retrieve the inserted ID
    const insertedID = insertContactRequest.recordset[0].ID;

    // Insert into [dbo].[CUSTOMER_CONTACT_CHANNEL] table
    const insertChannelQuery = `
      INSERT INTO [dbo].[CUSTOMER_CONTACT_CHANNEL]
        ([CONTACT_ID]
        ,[CHANNEL_TYPE]
        ,[CHANNEL_VALUE]
        ,[IS_PRIMARY]
        ,[CREATED_BY]
        ,[CREATED_AT]
        ,[UPDATED_BY]
        ,[UPDATED_AT])
      VALUES
        (@CONTACT_ID
        ,@CHANNEL_TYPE
        ,@CHANNEL_VALUE
        ,@IS_PRIMARY
        ,@CREATED_BY
        ,@CREATED_AT
        ,@UPDATED_BY
        ,@UPDATED_AT);
    `;

    const insertChannelValues = {
      CONTACT_ID: insertedID,
      CHANNEL_TYPE: data.channel[0].channelType.toString(), // Replace with actual value
      CHANNEL_VALUE: data.channel[0].channelValue.toString(), // Replace with actual value
      IS_PRIMARY: data.channel[0].isPrimary, // Replace with actual value
      CREATED_BY: "twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      UPDATED_BY: "twilio POC",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    // Execute the INSERT query for CUSTOMER_CONTACT_CHANNEL
    await pool
      .request()
      .input("CONTACT_ID", sql.Int, insertChannelValues.CONTACT_ID)
      .input("CHANNEL_TYPE", sql.NVarChar, insertChannelValues.CHANNEL_TYPE)
      .input("CHANNEL_VALUE", sql.NVarChar, insertChannelValues.CHANNEL_VALUE)
      .input("IS_PRIMARY", sql.NVarChar, insertChannelValues.IS_PRIMARY)
      .input("CREATED_BY", sql.NVarChar, insertChannelValues.CREATED_BY)
      .input("CREATED_AT", sql.DateTime, insertChannelValues.CREATED_AT)
      .input("UPDATED_BY", sql.NVarChar, insertChannelValues.UPDATED_BY)
      .input("UPDATED_AT", sql.DateTime, insertChannelValues.UPDATED_AT)
      .query(insertChannelQuery);

    // Insert into [dbo].[CUSTOMER_CONTACT_ACCOUNT] table
    const insertAccountQuery = `
      INSERT INTO [dbo].[CUSTOMER_CONTACT_ACCOUNT]
        ([CONTACT_ID]
        ,[CUSTOMER_ID]
        ,[IS_PRIMARY]
        ,[CREATED_BY]
        ,[CREATED_AT]
        ,[UPDATED_BY]
        ,[UPDATED_AT])
      VALUES
        (@CONTACT_ID
        ,@CUSTOMER_ID
        ,@IS_PRIMARY
        ,@CREATED_BY
        ,@CREATED_AT
        ,@UPDATED_BY
        ,@UPDATED_AT);
    `;
    const insertAccountValues = {
      CONTACT_ID: insertedID,
      CUSTOMER_ID: data.custId[0], // Replace with actual value
      IS_PRIMARY: "Y", 
      CREATED_BY: "twilio",
      CREATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
      UPDATED_BY: "twilio POC",
      UPDATED_AT: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    // Execute the INSERT query for CUSTOMER_CONTACT_ACCOUNT
    await pool
      .request()
      .input("CONTACT_ID", sql.Int, insertAccountValues.CONTACT_ID)
      .input("CUSTOMER_ID", sql.Int, insertAccountValues.CUSTOMER_ID)
      .input("IS_PRIMARY", sql.NVarChar, insertAccountValues.IS_PRIMARY)
      .input("CREATED_BY", sql.NVarChar, insertAccountValues.CREATED_BY)
      .input("CREATED_AT", sql.DateTime, insertAccountValues.CREATED_AT)
      .input("UPDATED_BY", sql.NVarChar, insertAccountValues.UPDATED_BY)
      .input("UPDATED_AT", sql.DateTime, insertAccountValues.UPDATED_AT)
      .query(insertAccountQuery);

    // If reached here, all inserts were successful
    res
      .status(200)
      .json({ message: "Contact and related data inserted successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error while inserting contact and related data." });
  }
};

module.exports = {
  updateContact,
  getContact,
  createContact,
};
