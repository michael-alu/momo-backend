// Datas
const transactions = [ "Incoming", "Payments", "Transfers", "Deposits", "Airtime", "Cash Power", "Third Party", "Withdrawals", "Bank Transfers", "Bundles"];
const transactionVolumes = [220, 160, 180, 90, 140, 120, 80, 100, 70, 60];
const transactionAmounts = [1200, 850, 1050, 780, 250, 310, 590, 720, 940, 100];

// the chart
const myChart = new Chart('myChart', {
    type: 'bar',
    data:{
        labels: transactions,
        datasets: [{
            label: 'Transaction Volume',
            backgroundColor: 'rgb(20, 74, 108)',
            data: transactionVolumes
        },
        {
            label: 'Transaction Amount(in thousands)',
            backgroundColor: 'rgb(251, 206, 0)',
            data: transactionAmounts
        }]
    },
    options: {
        datasets:{
            bar: {
                borderRadius: 1
            }
        }
    }
});
