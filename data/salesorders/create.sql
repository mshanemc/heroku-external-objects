CREATE TABLE salesorders
(
    orderid INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    companyname TEXT,
    status TEXT,
    currency TEXT,
    netsum NUMERIC,
    tax NUMERIC,
    totalsum NUMERIC,
    businesspartnerid TEXT
)