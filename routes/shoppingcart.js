const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

//REMEMBER HERE! To go over the endpoints and add authentication layer as needed.
router.get("/shoppingcartitems/:id", (req, res) => {
    const userId = req.params.id;
    const query = `SELECT rec.* FROM shoppingcart JOIN rec ON shoppingcart.record_id = rec.id WHERE shoppingcart.user_id = ?`;

    dbConnection.query(query, [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.status(200).json(results);
    })
})

router.delete("/shoppingcartdelete/:id", authenticateToken, (req, res) => {
    const recordId = req.params.id;
    const query = "DELETE FROM shoppingcart WHERE record_id = ?";

    dbConnection.query(query, [recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Nothing deleted." });
        }
        res.json({ success: true, message: "Record deleted successfully" });
        console.log(`Record deleted with id: ${recordId}`);
    })
})

router.delete("/shoppingcartdeleteall/:id", (req, res) => {
    const userId = req.params.id;
    const query = "DELETE FROM shoppingcart WHERE user_id = ?";

    dbConnection.query(query, [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 0) {
            console.log("Nothing deleted");
            return res.status(404).json({ error: "Nothing deleted." });
        }
        res.json({ success: true, message: "Records deleted successfully." });
        console.log("Records deleted successfully");
    })
})

router.post("/addtocart", (req, res) => {
    const { userId, recordId } = req.body;
    const query = "INSERT INTO shoppingcart (user_id, record_id) VALUES (?, ?)";
    const values = [userId, recordId];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                return res.status(501).json({ error: "Internal Server Error." });
            } else {
                console.log(error)
                return res.status(500).json({ error: "Internal Server Error." });
            }
        }
        if (results.affectedRows === 1) {
            console.log("Added to shopping cart successfully");
            return res.status(201).json({ success: true, message: "Added to shopping cart successfully" });
        }
    })
})

router.delete("/shoppingcarttimerdelete", (req, res) => {
    const currentTime = new Date();
    const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
    const query = "DELETE FROM shoppingcart WHERE added_at < ?";

    dbConnection.query(query, [sixHoursAgo], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 0) {
            console.log("Nothing deleted");
            return res.status(200).json({ success: `Nothing to be deleted. Current time: ${currentTime}` });
        }
        res.json({ success: true, message: "Shoppingcart items deleted successfully." });
        console.log("Shoppingcart items deleted successfully.");
    })
})

router.post("/sendcart2", (req, res) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY);

    const { shoppingcart, customerInfo } = req.body;
    let totalPrice = 0;

    let orderInfo = `
        Tilaajan nimi: ${customerInfo.name}
        Tilaajan puhelinnumero: ${customerInfo.phoneNumber}
        Tilaajan sähköposti: ${customerInfo.email}
        Tilaajan maksuvalinta: ${customerInfo.paymentOption}
        Toimitustapa: ${customerInfo.shippingOption}
        Tilaajan osoite:
        ${customerInfo.address}
    `

    const formattedItems = shoppingcart.map(item => {
        totalPrice += item.price
        return `
        Artisti: ${item.artist}
        Levyn nimi: ${item.title}
        Koko: ${item.size}
        Hinta: ${item.price}
        ---------------------
        `;
    }).join('');

    const textContent = `
        Tilaajan tiedot:
        ${orderInfo}

        Ostoskorin sisältö:
        ${formattedItems}

        Yhteishinta:
        ${totalPrice} euroa.
    `;

    const msg = {
        to: 'jukkavesanto93@gmail.com',
        from: 'mivesstore@gmail.com',
        subject: 'Ostoskori',
        text: textContent
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
            return res.status(201).json({ success: true, message: "Shoppingcart send successfully" });
        })
        .catch((error) => {
            console.error(error)
        })
})

router.post("/sendcart", (req, res) => {
    const { customerInfo, userId, shoppingcart } = req.body;
    console.log(shoppingcart)
    let orderId = "";

    const orderQuery = "INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, customer_paymentoption, customer_shippingoption, customer_address, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    const orderItemsQuery = "INSERT INTO order_items (order_id, record_id) VALUES (?, ?)";
    const soldQuery = "UPDATE rec SET sold = true WHERE id = ?";

    dbConnection.query(orderQuery, [userId, customerInfo.name, customerInfo.phoneNumber, customerInfo.email, customerInfo.paymentOption, customerInfo.shippingOption, customerInfo.address], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 1) {
            orderId = results.insertId;
            console.log("Inserting customer data successfully.");
        }

        //Loops shoppingcart items, first it inserts order item (the record) to order_items table, and then on row (results.affectedRows === 1) marks the item as sold in the rec table.
        shoppingcart.forEach(item => {
            dbConnection.query(orderItemsQuery, [orderId, item.id], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(501).json({ error: "Internal Server Error." });
                }
                if (results.affectedRows === 1) {
                    console.log("Inserting order item successfully.");
                    dbConnection.query(soldQuery, [item.id], (error, results) => {
                        if (error) {
                            console.log(error);
                            return res.status(501).json({ error: "Internal Server Error." });
                        }
                        if (results.affectedRows === 1) {
                            console.log("Updating sold status successfully.");
                        }
                    })
                }
            })
        })
        return res.status(201).json({ success: true, message: "New order item added successfully." })
    })
})

module.exports = router;