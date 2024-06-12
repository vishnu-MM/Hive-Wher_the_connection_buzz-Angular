import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SpinnerService, SpinnerStatus } from 'src/Shared/Services/spinner.service';

@Component({
  selector: 'loading',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit{
  showSpinner = true;

  constructor(private service: SpinnerService, private cdRef: ChangeDetectorRef) {}
  ngOnInit() {
    this.init();
  }

  init() {
    this.service.getSpinner().subscribe((status) => {
      // this.showSpinner = (status === SpinnerStatus.START);
      this.cdRef.detectChanges();
    });
  }
}