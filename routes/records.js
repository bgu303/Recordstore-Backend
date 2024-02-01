const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

router.get("/", (req, res) => {
    const query = "SELECT * FROM rec";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

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

router.delete("/:id", (req, res) => {
    const recordId = req.params.id;
    const query = "DELETE FROM rec WHERE id = ?";

    dbConnection.query(query, [recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true, message: "Record deleted successfully" });
        console.log(`Record deleted with id: ${recordId}`);
    })
})

router.delete("/shoppingcartdelete/:id", (req, res) => {
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

router.post("/addnewrecord", (req, res) => {
    const { artist, title, label, size, lev, kan, price, genre, discogs } = req.body;
    const query = "INSERT INTO rec (artist, title, label, size, lev, kan, price, genre, discogs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [artist, title, label, size, lev, kan, price, genre, discogs];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            return res.status(501).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 1) {
            console.log("New record added successfully");
            return res.status(201).json({ success: true, message: "New record added successfully" });
        }
    })
})

router.post("/sendcart", (req, res) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY);

    const { shoppingcart, customerInfo } = req.body;
    let totalPrice = 0;

    let orderInfo = `
        Tilaajan nimi: ${customerInfo.name}
        Tilaajan puhelinnumero: ${customerInfo.phoneNumber}
        Tilaajan sähköposti: ${customerInfo.email}
        Tilaajan osoite: ${customerInfo.address}
        Tilaajan postinumero: ${customerInfo.zipCode}
        Tilaajan kaupunki: ${customerInfo.city}
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

module.exports = router;