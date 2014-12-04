from flask import Flask

app = Flask('breakit')


app.run(host='0.0.0.0', port=8000, debug=True)
