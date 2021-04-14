function dateDDMMYYYYToDate(string) {
    if (10 !== string.length) return null;
    let d = Number(string.substring(0, 2)), m = Number(string.substring(3, 5));
    string.substring(6);
    if (d < 0) return null;
    if (d > 31) return null;
    if ((4 === m || 6 === m || 9 === m || 11 === m) && d > 30) return null;
    if (2 === m && d > 28) return null;
    let result = new Date;
    return result.setDate(string.substring(0, 2)), result.setMonth(Number(string.substring(3, 5)) - 1), 
    result.setYear(string.substring(6)), result;
}

function dateToDDMMYYYY(dt, seperator) {
    let da = new Date(dt);
    return (da.getDate() < 10 ? "0" + da.getDate() : da.getDate()) + seperator + (da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)) + seperator + da.getFullYear();
}

function dateToYYYYMMDD(dt, seperator) {
    let da = new Date(dt), d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate(), m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1);
    return da.getFullYear() + seperator + m + seperator + d;
}

function dateToHHMM(dt, seperator) {
    let da = new Date(dt);
    return (da.getHours() < 10 ? "0" + da.getHours() : da.getHours()) + seperator + (da.getMinutes() < 9 ? "0" + Number(da.getMinutes() + 1) : Number(da.getMinutes() + 1));
}

function numberOfNightsBetweenDates(startDate, endDate) {
    let start = new Date(startDate), end = new Date(endDate);
    start.setHours("1"), end.setHours("1"), start.setMinutes("0"), end.setMinutes("0"), 
    start.setSeconds("0"), end.setSeconds("0"), start.setMilliseconds("0"), end.setMilliseconds("0");
    return Math.floor(Math.abs((end - start) / 864e5));
}

function appendChild(el, child) {
    return el.appendChild(child);
}

function createElementAtt(parent, element, cls, att, text) {
    const el = document.createElement(element);
    return text && (el.textContent = text), cls.forEach((item => {
        el.classList.add(item);
    })), att.forEach((i => {
        el.setAttribute(i[0], i[1]);
    })), parent && appendChild(parent, el) || el;
}