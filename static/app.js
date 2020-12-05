let query;

function clearResponse() {
    let dataElem = document.getElementById('data');
    dataElem.style.display = "none";
    let errorMessageElem = document.getElementById('error-message');
    if (errorMessageElem)
        errorMessageElem.parentElement.removeChild(errorMessageElem);
}

function format(input, flag= true) {
    let date = new Date(input);
    if (!isNaN(date.getTime())) {
        let day = date.getDate().toString();
        let month = (date.getMonth() + 1).toString();

        if (flag)
            return (month[1] ? month : '0' + month[0]) + '/' + (day[1] ? day : '0' + day[0]) + '/' + date.getFullYear();
        return date.getFullYear() + '-' + (month[1] ? month : '0' + month[0]) + '-' + (day[1] ? day : '0' + day[0]);
    }
}

function deletePreviousData() {
    clearResponse();
    let displayElem = document.getElementById('display');
    displayElem.parentElement.removeChild(displayElem);

    let dataElem = document.getElementById('data');
    displayElem = document.createElement('div');
    displayElem.id = 'display';
    dataElem.appendChild(displayElem);

    let chartsElem = document.createElement('div');
    chartsElem.id = 'table-charts';
    displayElem.appendChild(chartsElem);
}

function resetInput() {
    document.getElementById('ticker').value = '';
    clearResponse();
}

function displayErrorMessage(message) {
    clearResponse();
    let errorElem = document.createElement('p');
    errorElem.id = 'error-message';
    errorElem.innerHTML = message;
    document.body.appendChild(errorElem);
}

function generateData(id) {
    if (query) {
        const xmlReq = new XMLHttpRequest();
        xmlReq.overrideMimeType('application/json');
        xmlReq.open('GET', "/ticker/?query=" + query + '&id=' + id, false);
        xmlReq.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 404) {
                displayErrorMessage('Error: No record has been found, please enter a valid symbol.');
            }
            if (this.readyState === 4 && this.status === 200) {
                if (id === 'summary') {
                    createStockSummaryData(JSON.parse(this.responseText));
                } else if (id === 'charts') {
                    createChartsData(JSON.parse(this.responseText));
                } else if (id === 'news') {
                    createNewsData(JSON.parse(this.responseText));
                } else {
                    createOutlookData(JSON.parse(this.responseText));
                }
            }
        };
        xmlReq.send();
    }
}

function displayTab(id) {
    let activeHeading = document.getElementsByClassName('active')[0];
    let toBeActiveHeading = document.getElementById(id);
    activeHeading.classList.remove('active');
    toBeActiveHeading.classList.add('active');

    if (!document.getElementById('table-' + id)) {
        generateData(id);
    }

    let displayElem = document.getElementById('display');
    for (let childNode of displayElem.childNodes) {
        if (childNode.id === ('table-' + id))
            childNode.style.display = 'block';
        else
            childNode.style.display = 'none';
    }
}

function unhideDataElement () {
    let dataElem = document.getElementById('data');
    dataElem.style.display = "block";

    generateData('charts');
}

function createOutlookData(outlookData) {
    let displayElem = document.getElementById('display');
    if (document.getElementById('table-outlook')){
        return;
    }
    let tableElem = document.createElement('table');
    let tbody = tableElem.createTBody();
    tableElem.id = 'table-outlook';
    tableElem.classList.add('table');

    for (let key of Object.keys(outlookData)) {
        let row = tbody.insertRow();
        let keyColumn = row.insertCell();
        keyColumn.classList.add('key');
        let keyTextNode = document.createTextNode(key.substring(1));
        keyColumn.appendChild(keyTextNode);

        let valueColumn = row.insertCell();
        valueColumn.classList.add('value');
        if (key === "EDescription") {
            valueColumn.classList.add('truncate');
        }
        let valueTextNode = document.createTextNode(outlookData[key]);
        valueColumn.appendChild(valueTextNode);
    }
    tableElem.style.display = 'none';
    displayElem.appendChild(tableElem);

    displayTab('outlook');
}

function createStockSummaryData(summaryData) {
    let displayElem = document.getElementById('display');
    let tableElem = document.createElement('table');
    let tbody = tableElem.createTBody();
    tableElem.id = 'table-summary';
    tableElem.classList.add('table');

    for (let key of Object.keys(summaryData)) {
        let row = tbody.insertRow();
        let keyColumn = row.insertCell();
        keyColumn.classList.add('key');
        let keyTextNode = document.createTextNode(key.substring(1));
        keyColumn.appendChild(keyTextNode);

        let valueColumn = row.insertCell();
        valueColumn.classList.add('value');
        if (summaryData[key] && (key === 'HChange' || key === 'IChange Percent')) {
            let change = Number(summaryData[key]), str = '';
            if (summaryData[key] && key === 'IChange Percent') {
                str = '%';
                change = Number(summaryData[key].substring(0, summaryData[key].length-1));
            }
            let textNode, imgNode = document.createElement('img'), value = change.toFixed(2) + str;
            if (change > 0) {
                textNode = document.createTextNode(value);
                imgNode.src = 'https://csci571.com/hw/hw6/images/GreenArrowUp.jpg';
                imgNode.classList.add('arrow-image');
            }
            else if (change < 0) {
                textNode = document.createTextNode(value);
                imgNode.src = 'https://csci571.com/hw/hw6/images/RedArrowDown.jpg';
                imgNode.classList.add('arrow-image');
            }
            else {
                textNode = document.createTextNode(value);
            }
            valueColumn.appendChild(textNode);
            valueColumn.appendChild(imgNode);
            continue;
        }
        let valueTextNode = document.createTextNode(summaryData[key]);
        valueColumn.appendChild(valueTextNode);
    }
    tableElem.style.display = 'none';
    displayElem.appendChild(tableElem);
}

function createChartsData(chartsData) {
    let displayElem = document.getElementById('display');
    let chartElem = document.getElementById('table-charts');

    if (!chartsData.length) {
        let emptyElem = document.createElement('p');
        emptyElem.id = 'empty-error-message';
        emptyElem.innerHTML = 'No stocks data found to display charts!';
        chartElem.appendChild(emptyElem);
        return;
    }

    let date = format(Date.now(), false);
    let stockPriceData = [], volumeData = []

    for (let info of chartsData) {
        const date = new Date(info['Date']);
        const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        stockPriceData.push([dateUTC, info['Stock Price']]);
        volumeData.push([dateUTC, info['Volume']]);
    }

    Highcharts.stockChart('table-charts', {
        title: {
            text: 'Stock Price ' + query.toUpperCase() + ' ' + date
        },

        subtitle: {
            text: '<a href="https://api.tiingo.com/" target="_blank">Source: Tiingo</a>',
            useHTML: true
        },

        xAxis: {
            minRange: 7 * 24 * 3600 * 1000
        },

        yAxis: [{
            labels: {
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },

            title: {
                text: 'Stock Price',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            opposite: false,
            min: 0
            }, {
            title: {
                text: 'Volume',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            labels: {
                style: {
                    color: Highcharts.getOptions().colors[1]
                },
            }
        }],

        plotOptions: {
            series: {
                pointWidth: 3,
                pointPlacement: 'on'
            }
        },

        rangeSelector: {
            buttons: [{
                type: 'day',
                count: 7,
                text: '7d'
            }, {
                type: 'day',
                count: 15,
                text: '15d'
            }, {
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'month',
                count: 3,
                text: '3m'
            }, {
                type: 'month',
                count: 6,
                text: '6m'
            }],
            selected: 4,
            allButtonsEnabled: true,
            inputEnabled: false
        },

        series: [{
            name: query.toUpperCase(),
            type: 'area',
            data: stockPriceData,
            tooltip: {
                valueDecimals: 2
            },

            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },

                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },

            threshold: null
        }, {
            name: query.toUpperCase() + ' Volume',
            type: 'column',
            id: query.toUpperCase() + '-volume',
            data: volumeData,
            yAxis: 1,
            color: 'rgb(75,75,75)'
        }]
    });

    chartElem.style.display = 'none';
    displayElem.appendChild(chartElem);
}

function createNewsData(newsData) {
    let displayElem = document.getElementById('display');
    let newsElem = document.createElement('div');
    newsElem.id = 'table-news';

    if (!newsData.length) {
        let emptyElem = document.createElement('p');
        emptyElem.id = 'empty-error-message';
        emptyElem.innerHTML = 'No news articles found to display!';
        newsElem.appendChild(emptyElem);
        return;
    }

    for (let article of newsData) {
        let cardContainerElem = document.createElement('div');
        cardContainerElem.classList.add('card-container');

        let imgNode = document.createElement('img');
        imgNode.src = article['Image'];
        imgNode.classList.add('card-image');

        let textNode = document.createElement('div');
        textNode.classList.add('card-text');
        textNode.innerHTML = '<p class="title-truncate"><b>' + article['Title'] +'</b></p>' + '<p class="other-text">Published Date: ' + format(article['Date']) + '</p><p class="other-text"><a href="' + article['Link to Original Post'] + '" target="_blank">See Original Post</a></p>'

        cardContainerElem.appendChild(imgNode);
        cardContainerElem.appendChild(textNode);
        newsElem.appendChild(cardContainerElem);
    }
    newsElem.style.display = 'none';
    displayElem.appendChild(newsElem);
}

function getStockSearchData() {
    deletePreviousData();
    query = document.getElementById('ticker').value;
    if (query) {
        const xmlReq = new XMLHttpRequest();
        xmlReq.overrideMimeType('application/json');
        xmlReq.open('GET', "/ticker/?query=" + query, true);
        xmlReq.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 404) {
                displayErrorMessage('Error: No record has been found, please enter a valid symbol.');
            }
            if (this.readyState === 4 && this.status === 200) {
                unhideDataElement();
                createOutlookData(JSON.parse(this.responseText));
            }
        };
        xmlReq.send();
    }
}