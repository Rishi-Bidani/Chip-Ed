// const electron = require("electron");
// const { ipcRenderer } = electron;

$(document).ready(() => {
	loadCalendarDays(new Date().getFullYear(), new Date().getMonth());
	// loadCalendarDays(2021, 2);
});

let months = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];
let days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function leapYearCheck(year) {
	if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
		return true;
	}

	return false;
}

function getDaysInMonth(month, year) {
	let days;

	if (
		month == 0 ||
		month == 2 ||
		month == 4 ||
		month == 6 ||
		month == 7 ||
		month == 9 ||
		month == 11
	) {
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

function displayDaysInWeek(calendarData) {
	for (let i = 0; i < days.length; i++) {
		if (i == days.length - 1 || i == days.length - 2) {
			calendarData += `<div class="calendar-table-header calendar-day-weekend" id="${days[i]}">${days[i]}</div>`;
		} else {
			calendarData += `<div class="calendar-table-header calendar-day-weekday" id="${days[i]}">${days[i]}</div>`;
		}
	}

	return calendarData;
}

function loadCalendarDays(year, month) {
	// month number is index from months array

	$(".calendar-body").css("grid-template-columns", "repeat(7, 1fr)");
	// $('.calendar-body').css('height', '');

	$("#month").html(months[month]);
	$("#year").html(year);

	// initalizing variables
	let calendarData = "";
	let count = 0;
	let nextMonthDate = 0;
	let now = new Date();
	let tmpDate = new Date(year, month, 0); // day ranges from 1-31, month ranges from 0-11
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
		if (
			(firstDayOfMonth + i) % days.length == 5 ||
			(firstDayOfMonth + i) % days.length == 6
		) {
			calendarData += `<div class="calendar-body-grid-item calendar-date-weekend" data-dayValue="${
				(firstDayOfMonth + i) % days.length
			}"
                        data-dateValue="${
							i + 1
						}" data-monthValue="${month}" data-yearValue="${year}" data-gridid="${count}"> ${
				i + 1
			} <div class="calendar-events" id="eventsOnDate${
				i + 1
			}"></div> </div>`;
		} else {
			calendarData += `<div class="calendar-body-grid-item calendar-date-weekday" data-dayValue="${
				(firstDayOfMonth + i) % days.length
			}"
                        data-dateValue="${
							i + 1
						}" data-monthValue="${month}" data-yearValue="${year}" data-gridid="${count}"> ${
				i + 1
			} <div class="calendar-events" id="eventsOnDate${
				i + 1
			}"></div> </div>`;
		}
		count++;
	}

	// create empty grid blocks at the end for visual improvement
	if (count < 35) {
		calendarData = addNextMonthDates(
			count,
			35,
			calendarData,
			nextMonthDate,
			month
		);
		// $(".calendar").css("height", "75vh");
	} else if (count > 35) {
		calendarData = addNextMonthDates(
			count,
			42,
			calendarData,
			nextMonthDate,
			month
		);
		// $(".calendar").css("height", "85vh");
	}

	// add the data to html
	$(".calendar-body").html(calendarData);

	// adds fade effect for every html content change
	// $('.calendar-body').fadeOut(function() {
	//   $(this).html(calendarData).fadeIn("fast");
	// })

	// highlight today when navigated to the current month
	if (
		month == now.getMonth() &&
		parseInt($("#year").html()) == now.getFullYear()
	) {
		$(`div[data-dateValue=${now.getDate()}]`).css(
			"background-image",
			"linear-gradient(#71935C, #92B69C)"
		);
	}

	getEventsFromDatabase(month, year);
}

function addNextMonthDates(gridCount, loopLimit, data, nextMonthDate, month) {
	for (let i = gridCount; i < loopLimit; i++) {
		if (i == gridCount) {
			data += `<div class="calendar-body-grid-item calendar-date-weekday calendar-month-view-next-month-date"
                data-gridid="${i}"> ${++nextMonthDate} <span id="nextMonthName">${
				months[(month + 1) % months.length]
			}</span></div>`;
		} else {
			data += `<div class="calendar-body-grid-item calendar-date-weekday calendar-month-view-next-month-date"
                data-gridid="${i}"> ${++nextMonthDate} </div>`;
		}
	}
	return data;
}

// gets events from database and displays them on the calendar
function getEventsFromDatabase(month, year) {
	// send synchronous request to get data from database before running other code
	const events = ipcRenderer.sendSync("get-events-data-from-database");
	console.log(events);
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