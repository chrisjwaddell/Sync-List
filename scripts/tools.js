function dateDDMMYYYYToDate(string) {
  // debugger
  if (string.length !== 10) {
    return null
  }

  let d = Number(string.substring(0, 2))
  let m = Number(string.substring(3,5))
  let y = string.substring(6)

  if (d < 0) {
    return null
  }
  if (d > 31) {
    return null
  }

  if ((m === 4) || (m === 6) || (m === 9) || (m === 11)) {
    if (d > 30) {
      return null
    }
  }
  if (m === 2) {
    if (d > 28) {
      return null
    }
  }

  let result = new Date()
  result.setDate(string.substring(0, 2))
  result.setMonth(Number(string.substring(3,5)) - 1)
  result.setYear(string.substring(6))
  return result
}

function dateToDDMMYYYY(dt, seperator) {
  let da = new Date(dt)


  let d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate()
  let m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)
  let y = da.getFullYear()
  return d + seperator + m + seperator + y
}


function dateToYYYYMMDD(dt, seperator) {
  let da = new Date(dt)

  let d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate()
  let m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)
  let y = da.getFullYear()
  return y + seperator + m + seperator + d
}


function dateToHHMM(dt, seperator) {
  let da = new Date(dt)

  let h = da.getHours() < 10 ? "0" + da.getHours() : da.getHours()
  let m = da.getMinutes() < 9 ? "0" + Number(da.getMinutes() + 1) : Number(da.getMinutes() + 1)
  return h + seperator + m
}


function numberOfNightsBetweenDates(startDate, endDate) {
  let start = new Date(startDate)
  let end = new Date(endDate)
  start.setHours("1")
  end.setHours("1")
  start.setMinutes("0")
  end.setMinutes("0")
  start.setSeconds("0")
  end.setSeconds("0")
  start.setMilliseconds("0")
  end.setMilliseconds("0")

  let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  let diffDays = Math.floor(Math.abs((end - start) / (oneDay)))

  return diffDays
}


function appendChild(el, child) {
  return el.appendChild(child)
}

function createElementAtt(parent, element, cls, att, text) {
  const el = document.createElement(element)
  // debugger

  if (text) {
    el.textContent = text
  }

  cls.forEach((item) => {
    el.classList.add(item)
  })

  att.forEach((i) => {
    el.setAttribute(i[0], i[1])
  })

  return (parent && appendChild(parent, el)) || el
}
