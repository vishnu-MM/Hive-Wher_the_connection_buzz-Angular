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
    private chart: any;
    private piChart: any;
    private weekList: string[] = [ "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY" ];
    private monthList: string[] = [ "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" ];

    constructor(private dataFetchService: UserService) { }

    ngOnInit(): void {
        this.initializeChart();
        this.fetchAndUpdateChart('YEAR').then();
    }

    private initializeChart(): void {
        const chart_ = document.getElementById('users-count') as HTMLCanvasElement;
        this.chart = new Chart(chart_, this.getChartObject);
        const piChart_ = document.getElementById('all-users-count') as HTMLCanvasElement;
        this.piChart = new Chart(piChart_, this.getPiChartObject);
    }

    protected async fetchAndUpdateChart(period: string): Promise<void> {
        this.fetchActiveUserData(period).then();
        this.fetchDeletedUserData(period).then();
        this.fetchAndUpdatePieChart().then();
    }

    private async fetchActiveUserData(period: string): Promise<void> {
        this.dataFetchService.fetchData(period).subscribe(data => this.updateGraphHelper(period, data, 0));
    }

    private async fetchDeletedUserData(period: string): Promise<void> {
        this.dataFetchService.fetchDeletedData(period).subscribe(data => this.updateGraphHelper(period, data, 1));
    }

    private async fetchAndUpdatePieChart(): Promise<void> {
        this.dataFetchService.fetchDataForPie().subscribe(data => this.updatePiGraphHelper(data));
    }

    private async updateGraphHelper(period: string, dataMap: Map<string, number>, datasetsIndex: number): Promise<void> {
        let list = Object.keys(dataMap);
        if (period === 'YEAR') list = this.monthList;        
        if (period === 'WEEK') list = this.weekList;
        if(datasetsIndex === 0) this.chart.data.labels = list;
        this.chart.data.datasets[datasetsIndex].data = Object.values(dataMap);
        this.chart.update();
    }

    private async updatePiGraphHelper(dataMap: Map<string, number>): Promise<void> {
        this.piChart.data.labels = Object.keys(dataMap);
        this.piChart.data.datasets[0].data = Object.values(dataMap);
        this.piChart.update();
    }

    private get getChartObject(): any { 
        return {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Active Users',
                        tension: 0.2,
                        fill: true,
                        backgroundColor: 'rgb(150, 255, 0)',
                        borderColor: 'rgb(150, 255, 0)',
                        data: []
                    }, {
                        label: 'Deleted Users',
                        tension: 0.2,
                        fill: true,
                        backgroundColor: 'rgb(255, 66, 66)',
                        borderColor: 'rgb(255, 66, 66)',
                        data: []
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: { usePointStyle: true }
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
        };
    }

    private get getPiChartObject(): any { 
        return {
            type: 'pie',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Users',
                        tension: 0.2,
                        fill: true,
                        backgroundColor: [
                            'rgb(150, 255, 0)', 
                            'rgb(255, 99, 132)', 
                            'rgb(54, 162, 235)'
                        ],
                        borderColor: [
                            'rgb(150, 255, 0)', 
                            'rgb(255, 99, 132)', 
                            'rgb(54, 162, 235)'
                        ],
                        data: []
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: { usePointStyle: true }
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
        };
    }
}