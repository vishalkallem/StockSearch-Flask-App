import requests as http
from datetime import date
from dateutil.relativedelta import relativedelta
from flask import Flask, request, jsonify


app = Flask(__name__)
TOKEN = 'b3e1026159094315e3ed88e6a7905a31b4f5ee0d'
API_KEY = 'be04a4eee4554b5487e896c36530aa03'

@app.route('/')
def main():
    return app.send_static_file('index.html')


@app.route('/ticker/', methods=['GET'])
def stock_search():
    query, id = request.args.get('query'), request.args.get('id')

    if id == 'summary':
        return jsonify(get_stock_summary(query))
    elif id == 'charts':
        return jsonify(get_charts_data(query))
    elif id == 'news':
        return jsonify(get_news_data(query))
    else:
        return get_outlook_data(query)


def get_outlook_data(query):
    def process_company_outlook(data):
        return {
            'ACompany Name': data['name'],
            'BStock Ticker Symbol': data['ticker'],
            'CStock Exchange Code': data['exchangeCode'],
            'DCompany Start Date': data['startDate'],
            'EDescription': data['description']
        }
    resp = http.get(f'https://api.tiingo.com/tiingo/daily/{query}?token={TOKEN}')
    return app.response_class(response={}, status=404, mimetype='application/json') if 'detail' in resp.json() else process_company_outlook(resp.json())


def get_stock_summary(query):
    def process_stock_summary(data):
        data = data[0]
        return {
            'AStock Ticker Symbol': data['ticker'],
            'BTrading Day': data['timestamp'][:10] if data['timestamp'] else None,
            'CPrevious Closing Price': data['prevClose'],
            'DOpening Price': data['open'],
            'EHigh Price': data['high'],
            'FLow Price': data['low'],
            'GLast Price': data['last'],
            'HChange': data['last'] - data['prevClose'] if data['last'] and data['prevClose'] else None,
            'IChange Percent': f"{((data['last'] - data['prevClose']) / data['prevClose']) * 100}%" if data['last'] and data['prevClose'] else None,
            'JNumber of Shares Traded': data['volume']
        }
    resp = http.get(f'https://api.tiingo.com/iex/{query}?token={TOKEN}')
    return process_stock_summary(resp.json())


def get_charts_data(query):
    def process_charts_data(data):
        response = []
        for info in data:
            response.append({
                'Date': info['date'],
                'Stock Price': info['close'],
                'Volume': info['volume']
            })
        return response
    prior_date = date.today() + relativedelta(months=-6)
    prior_date = f'{prior_date.year}-{prior_date.month}-{prior_date.day}'
    resp = http.get(f'https://api.tiingo.com/iex/{query}/prices?startDate={prior_date}&resampleFreq=12hour&columns=open,high,low,close,volume&token={TOKEN}')
    return process_charts_data(resp.json())

def get_news_data(query):
    def process_news_data(data):
        if data['status'] != 'ok':
            return app.response_class(response={}, status=404, mimetype='application/json')
        response = []
        for article in data['articles']:
            if article['urlToImage'] and article['title'] and article['publishedAt'] and article['url']:
                response.append({
                    'Image': article['urlToImage'],
                    'Title': article['title'],
                    'Date': article['publishedAt'],
                    'Link to Original Post': article['url']
                })
                if len(response) == 5:
                    return response
        return response

    resp = http.get(f'https://newsapi.org/v2/everything?apiKey={API_KEY}&q={query}')
    return process_news_data(resp.json())


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)