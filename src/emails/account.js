const sgMail = require('@sendgrid/mail')
const sendgridAPIKey = process.env.SENDGRIP_API_KEY

sgMail.setApiKey(sendgridAPIKey)


const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to: email,
        from: 'eric.barbosa.lopez@gmail.com',
        subject:'Task App',
        text:`Welcome to Task App, ${name}. Thanks for joining in!`
    })
}

const sendCancelationEmail = (email,name) => {
    sgMail.send({
        to: email,
        from: 'eric.barbosa.lopez@gmail.com',
        subject:'Task App Cancelation',
        text:`Sorry to see you go, ${name}.`
    })
}



module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
