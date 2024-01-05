import { promises as fs } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

// User permissions
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/",
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = join(cwd(), 'token.json');
const CREDENTIALS_PATH = join(cwd(), 'credentials.json');
const labelName = "open-in-app-backend";
//const aa = await fs.readFile(CREDENTIALS_PATH);
//const bb = JSON.parse(aa);
//console.log(bb);

// Recovers old user data from token.json. If token.json doesn't exist, returns null.
async function loadSavedCredentialsIfExist() {
  try {

    // fs.readfile to read a file, fs is file management lib
    const content = await fs.readFile(TOKEN_PATH);

    const credentials = JSON.parse(content);

    return google.auth.fromJSON(credentials);

  } 
  catch (err) {

    return null;

  }
}

// Saves credentials to token.json. If token.json doesn't exist, creates a new token.json
async function saveCredentials(client) {

  // app details
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}



// Authorization promise
async function authorize() {
  let client = await loadSavedCredentialsIfExist();

  // If token.json already exists, return whatever is in it.
  if (client) {
    return client;
  }

  // else, ask for permission and store it in token.json
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// get a list of all labels. auth parameter means the current logged in user.
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});

  const res = await gmail.users.labels.list({
    userId: 'me',
  });

  const labels = res.data.labels;
  
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return [];
  }

  // console.log('Labels:');
  // labels.forEach((label) => {
  //   console.log(`- ${label.name}`);
  // });

  return labels
}

// get a list of all unreplied emails. auth parameter means the current logged in user.
async function getUnrepliedMessages(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      q: "is:unread",
    });
    
    return response.data.messages || [];
}

function createMail(to, subject, body){
  const emailLines = [];
  emailLines.push(`To: ${to}`);
  emailLines.push('Content-type: text/html;charset=iso-8859-1');
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('');
  emailLines.push(body);

  const rawMail = emailLines.join('\r\n');
  return Buffer.from(rawMail).toString('base64');
}

// Log in if not logged in. If already logged in, use that account.
const auth = await authorize()

// Access the logged in user's gmail details
const gmail = google.gmail({ version: "v1", auth });


async function main() {
    // storing all labels in a constant
    const labels = await listLabels(auth)
    
    // [1,2,3,4,5].find(
    //   (item)=>{
    //     if(item === labelName){
    //       return item
    //     }
    //   }
    // )
    
    // finding the ID of the label we're going to use
    const label = labels.find(
        (label) => label.name === labelName
    );
    const labelId = label.id;

    //console.log(labelId)

    // Repeat  in Random intervals
    setInterval(async () => {

      //Get messages that have no prior reply
      const messages = await getUnrepliedMessages(auth);

      //console.log("Unreplied messages", messages);

      //  checking if there are any mails that did not get a reply
      if (messages && messages.length > 0) {

        for (const message of messages) {

          const messageData = await gmail.users.messages.get({
            auth,
            userId: "me",
            id: message.id,
          });

          const email = messageData.data;
          

          // ensuring if this message is not a thread (which has a previous reply)
          const hasReplied = email.payload.headers.some(
            (header) => header.name === "In-Reply-To"
          );

          
          if (!hasReplied) {

            let recipient = email.payload.headers.find(
                        (header) => header.name === "From"
                      ).value
            
            console.log(recipient)
            
            recipient = recipient.split(" ")
            recipient = recipient[recipient.length - 1]
            recipient = recipient.substring(1, recipient.length-1)

            // console.log(email.payload.headers.find(
            //               (header) => header.name === "Subject"
            //             ).value)
            
            // const to = "sarthaksaraf1@gmail.com"

            const to = recipient;
            const subject = `Auto-Reply`;
            const body = "Thank you for your email. I'm currently on vacation and will reply to you when I return.";
            
            const base64EncodedEmail = createMail(to, subject, body)

            try {
              const res = await gmail.users.messages.send({
                userId: 'me',
                resource: {
                  raw: base64EncodedEmail,
                },
              });
          
              console.log('Email sent:', res.data);
            } catch (error) {
              console.error('Error sending email:', error.message);
            }

            // Add label and move the email
            await gmail.users.messages.modify({
              auth,
              userId: "me",
              id: message.id,
              resource: {
                addLabelIds: [labelId],
                removeLabelIds: ["INBOX"],
              },
            });
          }
        }
      }
    }, Math.floor(Math.random() * (6 - 1 + 1) + 1) * 1000);
}



main()