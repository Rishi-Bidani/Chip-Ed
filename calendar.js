const electron = require("electron");
const { ipcRenderer } = electron;

// loads the current month and year when page opens
$(document).ready(function () {
  let now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  loadCalendarDays(currentYear, currentMonth);
  createYearDropdown(2000, 2040);
  createMonthDropdown();

  $('.calendar-body').fadeIn();

});

// variables
let months = ["january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december"
];
let days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function createYearDropdown(startYear, endYear) {
  let dropdownContent = $('#year-dropdown-list').html();

  for (let i = startYear; i < endYear + 1; i++) {
    if (i == parseInt($('#year').html())) {
      dropdownContent += `<div id="${i}" selected="selected" onclick="jumpTo('${i}', '', 'year-dropdown-list')">${i}</div>`;
    } else {
      dropdownContent += `<div id="${i}" onclick="jumpTo('${i}', '', 'year-dropdown-list')">${i}</div>`;
    }
  }

  $('#year-dropdown-list').html(dropdownContent);
}

function createMonthDropdown() {
  let dropdownContent = $('#month-dropdown-list').html();

  for (let i = 0; i < months.length; i++) {
    if (i == months.indexOf($('#month').html().toLowerCase())) {
      dropdownContent += `<div id="${months[i]}" selected="selected" onclick="jumpTo('', '${i}', 'month-dropdown-list')">${months[i]}</div>`;
    } else {
      dropdownContent += `<div id="${months[i]}" onclick="jumpTo('', '${i}', 'month-dropdown-list')">${months[i]}</div>`;
    }
  }

  $('#month-dropdown-list').html(dropdownContent);
}

function jumpTo(year, month, id) {
  if (year == "") {
    year = $('#year').html();
    $(`#${$('#month').html().toLowerCase()}`).removeAttr('selected');
    $(`#${months[month]}`).attr('selected', 'selected');
  } else if (month == "") {
    month = months.indexOf($('#month').html().toLowerCase());
    $(`#${$('#year').html()}`).removeAttr('selected');
    $(`#${year}`).attr('selected', 'selected');
  }

  loadCalendarDays(parseInt(year), parseInt(month));
  $(`#${id}`).hide(); // closing the dropdown list
}

// check if an year is a leap year
function leapYearCheck(year) {
  if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
    return true;
  }

  return false;
}

// gets the number of days in a month of an year
function getDaysInMonth(month, year) {
  let days;

  if (month == 0 || month == 2 || month == 4 || month == 6 || month == 7 ||
    month == 9 || month == 11) {
    days = 31;
  } else if (month == 1) {
    if (leapYearCheck(year)) {
      days = 29;
    } else {
      days = 28;
    }
  } else {
    days = 30;
  }

  return days;
}

// display days in the week on the calendar
function displayDaysInWeek(calendarData) {
  for (let i = 0; i < days.length; i++) {
    if (i == (days.length - 1) || i == (days.length - 2)) {
      calendarData += `<div class="calendar-table-header calendar-day-weekend" id="${days[i]}">${days[i]}</div>`;
    } else {
      calendarData += `<div class="calendar-table-header calendar-day-weekday" id="${days[i]}">${days[i]}</div>`;
    }
  }

  return calendarData;
}

// loads the calendar based on the month and year specified
function loadCalendarDays(year, month) { // month number is index from months array

  $('.calendar-body').css('grid-template-columns', 'repeat(7, 1fr)');
  // $('.calendar-body').css('height', '');

  // change header displaying month year
  $('#month').html(months[month]);
  $('#year').html(year);

  // update buttons using the header
  updateYearMonthLabels();

  // initalizing variables
  let calendarData = "";
  let count = 0;
  let nextMonthDate = 0;
  let now = new Date();
  let tmpDate = new Date(year, month, 0) // day ranges from 1-31, month ranges from 0-11
  let firstDayOfMonth = tmpDate.getDay();
  let daysInMonth = getDaysInMonth(month, year);

  let daysInLastMonth;
  if (month == 0) {
    daysInLastMonth = getDaysInMonth(11, year - 1);
  } else {
    daysInLastMonth = getDaysInMonth(month - 1, year);
  }
  daysInLastMonth = daysInLastMonth - firstDayOfMonth;

  // display the days in a week
  calendarData = displayDaysInWeek(calendarData);

  // get to the starting day of the week by creating empty grid blocks
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarData += `<div class="calendar-body-grid-item calendar-date-weekday calendar-month-view-last-month-date"
                    data-gridid="${count}">${++daysInLastMonth}</div>`;
    count++;
  }

  // display the days of the month
  for (let i = 0; i < daysInMonth; i++) {
    if ((firstDayOfMonth + i) % days.length == 5 || (firstDayOfMonth + i) % days.length == 6) {
      calendarData += `<div class="calendar-body-grid-item calendar-date-weekend" data-dayValue="${(firstDayOfMonth+i)%days.length}"
                      data-dateValue="${i+1}" data-monthValue="${month}" data-yearValue="${year}" data-gridid="${count}"> ${i+1} <div class="calendar-events" id="eventsOnDate${i+1}"></div> </div>`;
    } else {
      calendarData += `<div class="calendar-body-grid-item calendar-date-weekday" data-dayValue="${(firstDayOfMonth+i)%days.length}"
                      data-dateValue="${i+1}" data-monthValue="${month}" data-yearValue="${year}" data-gridid="${count}"> ${i+1} <div class="calendar-events" id="eventsOnDate${i+1}"></div> </div>`;
    }
    count++;
  }

  // create empty grid blocks at the end for visual improvement
  if (count < 35) {
    calendarData = addNextMonthDates(count, 35, calendarData, nextMonthDate, month);
    $('.calendar').css('height', '75vh');
  } else if (count > 35) {
    calendarData = addNextMonthDates(count, 42, calendarData, nextMonthDate, month);
    $('.calendar').css('height', '85vh');
  }

  // add the data to html
  $('.calendar-body').html(calendarData);

  // adds fade effect for every html content change
  // $('.calendar-body').fadeOut(function() {
  //   $(this).html(calendarData).fadeIn("fast");
  // })

  // highlight today when navigated to the current month
  if (month == now.getMonth() && parseInt($('#year').html()) == now.getFullYear()) {
    $(`div[data-dateValue=${now.getDate()}]`).css('background-image', 'linear-gradient(#71935C, #92B69C)');
  }

  getEventsFromDatabase(month, year);
}

// gets events from database and displays them on the calendar
function getEventsFromDatabase(month, year) {
  // send synchronous request to get data from database before running other code
  const events = ipcRenderer.sendSync("get-events-data-from-database");

  // display events on the calendar
  if (events != "no-events") {
    for (let i = 0; i < events.length; i++) {
      let startTime = new Date(events[i]["eventstarttime"]);
      if (startTime.getFullYear() == year && startTime.getMonth() == month) {
        let calendarEvent = `<div class="calendar-event"> ${events[i]["eventname"]} </div>`;
        $(
          `.calendar-body-grid-item[data-dateValue=${startTime.getDate()}][data-monthValue=${startTime.getMonth()}][data-yearValue=${startTime.getFullYear()}] .calendar-events`
        ).html(calendarEvent);
      }
    }
  }
}

// add dates for the next month on the current month view
function addNextMonthDates(gridCount, loopLimit, data, nextMonthDate, month) {
  for (let i = gridCount; i < loopLimit; i++) {
    if (i == gridCount) {
      data += `<div class="calendar-body-grid-item calendar-date-weekday calendar-month-view-next-month-date"
              data-gridid="${i}"> ${++nextMonthDate} <span id="nextMonthName">${months[(month+1)%months.length]}</span></div>`;
    } else {
      data += `<div class="calendar-body-grid-item calendar-date-weekday calendar-month-view-next-month-date"
              data-gridid="${i}"> ${++nextMonthDate} </div>`;
    }
  }
  return data;
}

// get previous or next month/year depending on data
function getNextPrevMonth(month, nextCheck) {
  for (let i = 0; i < months.length; i++) {
    if (month == months[i]) {
      let year = parseInt($('#year').html());
      if (nextCheck) {
        if (i == months.length - 1) {
          loadCalendarDays(year + 1, 0);
        } else {
          loadCalendarDays(year, i + 1);
        }
        break;
      } else {
        if (i == 0) {
          loadCalendarDays(year - 1, months.length - 1);
        } else {
          loadCalendarDays(year, i - 1);
        }
        break;
      }
    }
  }
}

// update buttons
function updateYearMonthLabels() {
  let month = $('#month').html();
  let year = $('#year').html();

  $('#selected-month').html(month);
  $('#selected-year').html(year);

}

// navigates to today
function loadToday() {
  loadCalendarDays((new Date()).getFullYear(), (new Date()).getMonth());
}

// go to previous month functionality
$("#prev").click(function () {
  let selectedMonth = $("#month").html().toLowerCase();
  getNextPrevMonth(selectedMonth, false);
});

// go to next month functionality
$("#next").click(function () {
  let selectedMonth = $("#month").html().toLowerCase();
  getNextPrevMonth(selectedMonth, true);
});

// go to today functionality
$('#go-to-today').click(function () {
  loadToday();
})

$('#dayView, #monthView').on('click', function () {
  $(this).siblings().removeClass('active');
  $(this).addClass('active');
})

$('#selected-year').click(function (e) {
  $('#year-dropdown-list').slideToggle();
  //$('#year-dropdown-list').scrollTop($('#year-dropdown-list').find('[selected=selected]').position().top);
  e.stopPropagation();
})

$('#selected-month').click(function (e) {
  $('#month-dropdown-list').slideToggle();
  //$('#month-dropdown-list').scrollTop($('#month-dropdown-list').find('[selected=selected]').position().top);
  e.stopPropagation();
})

$(document).click(function (e) {
  if ($(e.target).attr("id") != "year-dropdown-list" ||
    $(e.target).attr('id') != "month-dropdown-list") {
    $('#month-dropdown-list').slideUp("fast");
    $('#year-dropdown-list').slideUp("fast");
  }
})

// send ics file path to convert to json
document.getElementById("sendpls").addEventListener("click", function () {
  // $('#sendpls').change(function() {
  //   ipcRenderer.send('convert-file-to-json', this.value.substring(this.value.split("").indexOf("h")+2, this.value.length));
  // })

  ipcRenderer.send("convert-file-to-json", "./example.ics");
});

// receive converted response from main process
ipcRenderer.on("file-converted-to-json", function (event, arg) {
  if (arg == "file-error") {
    console.log(arg); // temporary, add css to show error
  } else if (arg == "file-success") {
    console.log(arg); // temporary
    loadToday();
  }
});