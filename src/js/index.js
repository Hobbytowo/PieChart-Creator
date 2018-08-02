// creating required number of slices for fill data (name and value)

const createDataForm = nr => {
  const chartContainer = document.querySelector('.article--chart')
  const formContent = document.querySelector('.form__content')
  const sectionDetails = document.querySelector('.section--itemsData')
  sectionDetails.style.display = "block"

  const currentNrOfSlices = document.querySelectorAll('.form__slice').length

  if (currentNrOfSlices > nr) {
    formContent.removeChild(formContent.lastChild)
    createDataForm(nr)
  } else {
    for (let i = currentNrOfSlices; i < nr; i++) {
      const divSlice = document.createElement('div')
      divSlice.classList.add('form__slice')

      divSlice.innerHTML = `
        <h3 class="title">Slice ${ i + 1 }</h3>
        <div class="form__data">
          <label for="inputName${ i }" class="form__label">Name: </label>
          <input id="inputName${ i }" type="text" class="form__input sliceName">
        </div>
        <div class="form__data data data--value">
          <label for="inputValue${ i }" class="form__label">Value: </label>
          <input id="inputValue${ i }" type="number" min="0" class="form__input sliceValue" placeholder="Write only numbers">
        </div>
      `

      formContent.appendChild(divSlice)
    }
  }

  if (currentNrOfSlices <= nr && chartContainer.style.display === "flex") {
    createPieChart()
  }
}

// event for sumbit first form and create second form

const buttonMainData = document.querySelector('.button--mainData')

buttonMainData.addEventListener('click', () => {
  const chosenOption = document.querySelector('.select--numberOfItems')
  createDataForm(chosenOption.selectedIndex + 2)
})

// function gettings inputs values

const getValues = inputsClass => {
  const dataNames = document.querySelectorAll(`.${ inputsClass }`)
  let dataNamesArr = []

  dataNames.forEach(input => {
    dataNamesArr.push(input.value)
  })

  return dataNamesArr
}

// generating table of colors for slices

const hexToDec = val => parseInt(val, 16)
const decToHex = val => val !== 0 ? val.toString(16) : '00'

const getColorsArray = (col1, nrOfSlices) => {
  const getHexaColorsArray = rgb => {
    const step = ~~((255 - Math.min(...rgb)) / nrOfSlices)
    const getNewColor = (rgb, i) => rgb.map(x => Math.min(x + step * i, 255))
    const getNewRGB = (col, nr) => Array(nr).fill(col).map(getNewColor)
    const newRGB = getNewRGB(rgb, nrOfSlices)
    return newRGB.map(rgb => ['#', ...rgb.map(decToHex)].join(''))
  }
  return getHexaColorsArray(col1)
}

// getting neessery data for draw chart

const getData = () => {
  const dataNames = getValues('sliceName')
  const dataValues = getValues('sliceValue')
  const numberOfSlices = dataValues.length

  const leadingColor = document.querySelector('.input--color').value
  const leadingColorRGB = leadingColor.match(/../g).map(hexToDec)
  const colors = getColorsArray(leadingColorRGB, numberOfSlices)

  // creating data array from the biggest to the smallest

  const sum = dataValues.reduce((a, b) => a * 1 + b * 1, 0)
  const percentage = dataValues.map(x => Math.round(x * 1000 / sum / 10))

  const getBasicDataForArr = x => {
    const getDataArr = i => {
      return {
        name: dataNames[i],
        value: dataValues[i],
        percent: percentage[i]
      }
    }
    for (let i in dataNames) {
      x.push(getDataArr(i))
    }
  }

  let dataArr = []
  getBasicDataForArr(dataArr)
  dataArr.sort((a, b) => a.value - b.value).reverse()
  const addColorToArr = arr => arr.map((x, i) => (x.color = colors[i]))
  addColorToArr(dataArr)

  const percentageSum = percentage.reduce((a, b) => a * 1 + b * 1, 0)
  if (percentageSum !== 100) {
    dataArr[0].percent += 100 - percentageSum
  }

  return dataArr
}

// creating chart function

const createPieChart = () => {
  const chartContainer = document.querySelector('.article--chart')
  chartContainer.style.display = "flex"

  const titleContainer = document.querySelector('.title--chart')
  const chartTitle = document.querySelector('#chartTitle').value
  titleContainer.textContent = chartTitle

  const dataArr = getData()

  // creating SVG chart

  const radius = svg.style.width.slice(0, -2) / 2
  let rotation = 0

  const calculateDeg = percent => 360 * percent / 100
  const calculateBaseDeg = deg => deg > 180 ? 360 - deg : deg
  const calculateRadian = baseDeg => baseDeg * Math.PI / 180

  const calculateRatios = percent => {
    const deg = calculateDeg(percent)
    const baseDeg = calculateBaseDeg(deg)
    const radians = calculateRadian(baseDeg)
    const sweep = radians > Math.PI ? '1' : '0'

    const valueZ = Math.sqrt(2 * Math.pow(radius, 2) * (1 - Math.cos(radians)))
    const baseValX = baseDeg <= 90 ? radius * Math.sin(radians) : radius * Math.sin((180 - baseDeg) * Math.PI / 180)
    const valueX = deg <= 180 ? baseValX + radius : radius - baseValX
    const valueY = Math.sqrt((Math.pow(valueZ, 2)) - Math.pow(baseValX, 2))

    return [deg, sweep, valueX, valueY]
  }

  const drawSlice = (data, i) => {
    const [deg, sweep, valueX, valueY] = calculateRatios(data.percent)
    const svg = document.querySelector('.svg')

    if (data.percent === 100) {
      const newCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      newCircle.setAttributeNS(null, 'cx', `${ radius }`)
      newCircle.setAttributeNS(null, 'cy', `${ radius }`)
      newCircle.setAttributeNS(null, 'r', `${ radius }`)
      newCircle.setAttributeNS(null, 'fill', data.color)
      newCircle.textContent = `Name: ${ data.name }, Value: ${ data.value }, Percent: ${ data.percent }%`
      svg.appendChild(newCircle)
    } else {
      const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      newPath.setAttributeNS(null, 'd', `M${ radius },${ radius } L${ radius },0 A${ radius },${ radius } ${ sweep } 1,1 ${ valueX }, ${ valueY } z`)
      newPath.setAttributeNS(null, 'fill', data.color)
      newPath.setAttributeNS(null, 'transform', `rotate(${ rotation }, ${ radius }, ${ radius })`)

      rotation += deg
      newPath.textContent = `Name: ${ data.name }, Value: ${ data.value }, Percent: ${ data.percent }%`
      svg.appendChild(newPath)
    }
  }

  for (let i = 0; i < dataArr.length; i++) {
    drawSlice(dataArr[i], i)
  }
}

// invoking drawing pie chart (check validate inputs)

const buttonCreateChart = document.querySelector('.button--createChart')

buttonCreateChart.addEventListener('click', () => {
  const dataValues = getValues('sliceValue')
  dataValues.every(x => !isNaN(x) && x > 0) && createPieChart()
})

// Tooltip

const svg = document.querySelector('.svg')
const tooltip = document.querySelector('.tooltip')

svg.addEventListener('mousemove', e => {
  if (e.target.nodeName === 'path' || e.target.nodeName === 'circle') {
    tooltip.style.left = `${ e.clientX + 20 }px`
    tooltip.style.top = `${ e.clientY - 30 }px`
    tooltip.style.display = 'block'
    tooltip.textContent = e.target.textContent
  }
})

svg.addEventListener('mouseout', e => {
  if (e.target.nodeName === 'path' || e.target.nodeName === 'circle') {
    tooltip.style.display = 'none'
  }
})
