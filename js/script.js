// Highlight active sidebar link
const menuLinks = document.querySelectorAll(".sidebar ul li a");
menuLinks.forEach(link => {
    link.addEventListener("click", () => {
        menuLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
    });
});

// Search filter for cards (simple demo for now)
const searchInput = document.getElementById("search");
searchInput.addEventListener("keyup", function () {
    const query = this.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
        const content = card.textContent.toLowerCase();
        card.style.display = content.includes(query) ? "block" : "none";
    });
});

// Notification popup (simulated)
document.querySelector(".fa-bell").addEventListener("click", () => {
    alert("You have 3 new transactions today!");
});

// Chart.js example (replace with real data later)
const chartData = {
    labels: ["Incoming", "Payments", "Transfers", "Deposits", "Bundles"],
    datasets: [{
        label: 'Transaction Count',
        data: [450, 320, 180, 140, 220],
        backgroundColor: ['#075877', '#ffd600', '#f77f00', '#28a745', '#6f42c1'],
        borderRadius: 6
    }]
};

const ctx = document.getElementById("myChart").getContext("2d");
new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Transactions by Type', font: { size: 16 } }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 50
                }
            }
        }
    }
});

// Sidebar collapse toggle (optional bonus)
const sidebar = document.querySelector('.sidebar');
const sidebarLinks = document.querySelectorAll('.sidebar ul li a');

sidebar.style.width = '70px';
document.querySelector('.main').style.marginLeft = '70px';

sidebarLinks.forEach(link => {
    link.querySelector('div').style.display = 'none';
    link.style.justifyContent = 'center';
});
