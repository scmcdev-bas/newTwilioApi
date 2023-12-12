const createPool = require("./db");
const moment = require("moment");
const sql = require("mssql");

const getCustomer = async (req, res) => {
  const data = req.body;

  try {
    const pool = await createPool();
    const selectQuery = `
    SELECT
      CCA.[CONTACT_ID],
      CCA.[CUSTOMER_ID],
      CCA.[IS_PRIMARY] AS [AccountIsPrimary],

      CC.[TITLE],
      CC.[FIRST_NAME],
      CC.[LAST_NAME],
      CC.[STATUS],

      CCC.[ID] AS [ChannelID],
      CCC.[CHANNEL_TYPE],
      CCC.[CHANNEL_VALUE]
    FROM
      [scmc-POC].[dbo].[CUSTOMER_CONTACT_ACCOUNT] AS CCA
    JOIN
      [scmc-POC].[dbo].[CUSTOMER_CONTACT] AS CC
    ON
      CCA.[CONTACT_ID] = CC.[ID]
    JOIN
      [scmc-POC].[dbo].[CUSTOMER_CONTACT_CHANNEL] AS CCC
    ON
      CC.[ID] = CCC.[CONTACT_ID]
    WHERE
      CCA.[CONTACT_ID] = @CONTACT_ID
    `;

    const selectValues = {
      CONTACT_ID: data.CONTACT_ID,
    };

    const selectResults = await pool
      .request()
      .input("CONTACT_ID", sql.VarChar, selectValues.CONTACT_ID)
      .query(selectQuery);
    console.log(selectResults.recordset[0])
    res.status(200).json({ message: "Data successfully selected." ,data : selectResults.recordset[0]});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching data." });
  }
};

module.exports = {
  getCustomer,
};
