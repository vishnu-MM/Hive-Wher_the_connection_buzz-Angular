import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { Chart, registerables } from "node_modules/chart.js";
import { UserService } from 'src/Shared/Services/user.service';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
    chart: any;

    constructor(private dataFetchService: UserService) { }

    ngOnInit(): void {
        this.initializeChart();
        this.fetchAndUpdateChart('YEAR');
    }

    initializeChart(): void {
        const ctx = document.getElementById('myChart') as HTMLCanvasElement;
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Newly Joined Users',
                        tension: 0.2,
                        fill: true,
                        backgroundColor: 'rgba(44,220,185,0.2)',
                        borderColor: 'rgb(44,217,220)',
                        data: []
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        suggestedMin: 0,
                        suggestedMax: 10,
                        beginAtZero: true,
                    }
                }
            }
        });
    }

    fetchAndUpdateChart(period: string): void {
        this.dataFetchService.fetchData(period).subscribe(data => {
            let list;
            if (period === 'YEAR') {
                list = [ "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
                         "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" ];
            }
            else if (period === 'WEEK') {
                list = [ "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY" ];
            }
            else {
                list = Object.keys(data);
            }

            this.chart.data.labels = list;
            this.chart.data.datasets[0].data = Object.values(data);
            this.chart.update();
        });
    }
}
