const electron = require("electron");
const url = require("url");
const path = require("path");
const ical2json = require('ical2json');
const fs = require('fs');

// initialize and connect to the database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, 'calendarEventsData.sqlite3')
  },
  useNullAsDefault: true
});

const { app, BrowserWindow, Menu, ipcMain, webContents } = electron;


let mainWindow;

app.on("ready", function () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true, // for allowing require in html file
      contextIsolation: false,
      enableRemoteModule: true
    },
  });
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "templates/home.html"), // earlier mainWindow
      protocol: "file",
      slashes: true,
    })
  );
  mainWindow.maximize();
  // add custom  Menu here
});


// create events table in the database
knex.schema.hasTable('events').then(function(exists) {
  if (!exists) {
    knex.schema.createTable('events', function(table) {
      table.increments('eventsno').primary();
      table.string('eventname', 30).notNullable();
      table.string('eventdescription');
      table.datetime('eventstarttime').notNullable();
      table.datetime('eventendtime').notNullable();
      table.string('timezone');
    }).then(() => {});
  }
});

// create quick events table in the database
knex.schema.hasTable('quick_events').then(function(exists) {
  if (!exists) {
    knex.schema.createTable('quick_events', function(table) {
      table.increments('quickeventssno').primary();
      table.string('eventname').notNullable();
      table.datetime('eventstarttime').notNullable();
    }).then(() => {});
  }
});

// store the events in the database
ipcMain.on('convert-file-to-json', function(event, arg) {
  // console.log(arg); // arg is file location

  fs.readFile(arg, 'utf8', function(err, data) {

    if (err) { // catch error and send appropriate response
      event.sender.send('file-converted-to-json', "file-error");
    } else {
      // read the file and convert to json
      let jsonData = ical2json.convert(data);
      let eventsData = jsonData['VCALENDAR'][0]['VEVENT'];

      for (let i = 0; i < eventsData.length; i++) {
        // get keys of each object to access their values
        let keys = Object.keys(eventsData[i]);
        // returns the key for start and end time for different time zones
        let startTime = keys.filter(function(key) {
          return key.indexOf("DTSTART") === 0;
        })[0];
        let endTime = keys.filter(function(key) {
          return key.indexOf("DTEND") === 0;
        })[0];

        // create objects to store in the database
        let calendarEvent = {
          eventname: eventsData[i]['SUMMARY'],
          eventdescription: eventsData[i]['DESCRIPTION'],
          eventstarttime: new Date(eventsData[i][startTime].substring(0, 4), parseInt(eventsData[i][startTime].substring(4, 6)) - 1, eventsData[i][startTime].substring(6, 8),
            eventsData[i][startTime].substring(9, 11), eventsData[i][startTime].substring(11, 13), eventsData[i][startTime].substring(13, 15)),
          eventendtime: new Date(eventsData[i][endTime].substring(0, 4), parseInt(eventsData[i][endTime].substring(4, 6)) - 1, eventsData[i][endTime].substring(6, 8),
            eventsData[i][endTime].substring(9, 11), eventsData[i][endTime].substring(11, 13), eventsData[i][endTime].substring(13, 15)),
          timezone: startTime.split(";")[1].split("=")[1]
        };

        knex.insert(calendarEvent).into('events').then(() => {})
      }
      // send file converted signal
      event.sender.send('file-converted-to-json', "file-success");
    }
  })
});

// send response to renderer process based on the events in the database
ipcMain.on('get-events-data-from-database', function(event) {
  knex.schema.hasTable('events').then(function(exists) {
    if (exists) {
      knex.select().table('events').then((data) => {
        event.returnValue = data;
      });
    } else { // response if no data in the database
      event.returnValue = "no-events";
    }
  })
})
