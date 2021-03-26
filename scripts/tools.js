function dateDDMMYYYYToDate(e) {
    if (10 !== e.length) return null;
    var t = Number(e.substring(0, 2));
    var n = Number(e.substring(3, 5));
    var r = e.substring(6);
    if (t < 0) return null;
    if (31 < t) return null;
    if (4 === n || 6 === n || 9 === n || 11 === n) if (30 < t) return null;
    if (2 === n) if (28 < t) return null;
    let u = new Date();
    u.setDate(e.substring(0, 2));
    u.setMonth(Number(e.substring(3, 5)) - 1);
    u.setYear(e.substring(6));
    return u;
}

function dateToDDMMYYYY(e, t) {
    let n = new Date(e);
    var r;
    var u;
    var a;
    return (n.getDate() < 10 ? "0" + n.getDate() : n.getDate()) + t + (n.getMonth() < 9 ? "0" + Number(n.getMonth() + 1) : Number(n.getMonth() + 1)) + t + n.getFullYear();
}

function dateToYYYYMMDD(e, t) {
    let n = new Date(e);
    var r = n.getDate() < 10 ? "0" + n.getDate() : n.getDate();
    var e = n.getMonth() < 9 ? "0" + Number(n.getMonth() + 1) : Number(n.getMonth() + 1);
    var u;
    return n.getFullYear() + t + e + t + r;
}

function dateToHHMM(e, t) {
    let n = new Date(e);
    var r;
    var u;
    return (n.getHours() < 10 ? "0" + n.getHours() : n.getHours()) + t + (n.getMinutes() < 9 ? "0" + Number(n.getMinutes() + 1) : Number(n.getMinutes() + 1));
}

function numberOfNightsBetweenDates(e, t) {
    let n = new Date(e);
    let r = new Date(t);
    n.setHours("1");
    r.setHours("1");
    n.setMinutes("0");
    r.setMinutes("0");
    n.setSeconds("0");
    r.setSeconds("0");
    n.setMilliseconds("0");
    r.setMilliseconds("0");
    var u;
    var a;
    return Math.floor(Math.abs((r - n) / 864e5));
}

function appendChild(e, t) {
    return e.appendChild(t);
}

function createElementAtt(e, t, n, r, u) {
    const a = document.createElement(t);
    if (u) a.textContent = u;
    n.forEach(e => {
        a.classList.add(e);
    });
    r.forEach(e => {
        a.setAttribute(e[0], e[1]);
    });
    return e && appendChild(e, a) || a;
}