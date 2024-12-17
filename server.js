const express = require('express');

const app = express();

const { spawn } = require('child_process');

app.set('view engine', 'ejs');

const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('*', (req, res) => {
    res.render('index', {has_date: 0})
    
})


async function predict(date){
    return new Promise( (resolve, reject) => {
        const predict = spawn('python', ['script.py'])
        
        predict.stdin.write(date)
        predict.stdin.end()

        let result = ''
        
        let err_out = ''

        predict.stdout.on('data', (data) => {
            result = data.toString()
        });
        
        predict.stderr.on('data', (data) => {
            err_out += data.toString()
        })
        
        predict.on('close', (error) => {
            if (error == 0){
                resolve(result)
            }
            else{
                reject(`Error occurred: Error  Code: ${error}, Error Message: ${err_out}`)
            }
        })
    })
}

app.post('/', async (req, res) => {

    date = req.body.date.toString()
    test_date = new Date(date)
    
    // Date is invalid
    if (isNaN(test_date)) {
        res.render('index', {has_date: 0})
        return
    }


    prediction = []
    try{
        prediction = await predict(date)
        console.log(prediction.toString())
    }
    catch(err){
        console.error(err)
        res.render('index', {has_date: 0})
    }
    
    
    dates = []
    for (let i = 0; i < 7; i++){
        test_date.setDate(test_date.getDate() + 1);
        if (test_date.getDay() == 6 || test_date.getDay() == 0) continue

        dates.push(test_date.toDateString())
    }



    prediction = JSON.parse(prediction)

    labels = []
    highest = 0
    lowest = 1000
    total = 0
    for(let i = 0; i < 5; i++){
        if(prediction[0][i] < prediction[1][i]) {
            labels.push('Bullish')
        }
        else {
            labels.push('Bearish')
        }
        prediction[3][i] =  Math.min(prediction[3][i], prediction[1][i], prediction[0][i])
        prediction[2][i] =  Math.max(prediction[2][i], prediction[1][i], prediction[0][i])
        lowest = Math.min(lowest, prediction[3][i])
        highest = Math.max(highest, prediction[2][i])

        total+=prediction[1][i]
    }

    average = total/5

    items = []
    for(let i = 0; i < 5; i++){
        items.push({'date': dates[i], 'open': prediction[0][i], 'close': prediction[1][i], 'high': prediction[2][i], 'low': prediction[3][i], label: labels[i], 'highest': highest, 'lowest': lowest, 'average': average})
    }
    
    console.log(items)
    console.log(items[0].date)

    res.render('index', {date, has_date: 1, pred: items, high: 0, low: 0, avg_close:  0})
})



app.listen(port, () => {
  console.log(`Server is running at http://127.0.0.1:${port}`);
});

//app url: 