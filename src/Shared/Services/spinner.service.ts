import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class SpinnerService {
	private count: number = 0;
	private spinner$ = new BehaviorSubject<SpinnerStatus>(SpinnerStatus.STOP);

	constructor() { }

	getSpinner(): Observable<SpinnerStatus> {
		return this.spinner$.asObservable();
	}

	requestStarted() {
		if (++this.count === 1)
			this.spinner$.next(SpinnerStatus.START);
	}

	requestEnded() {
		if (--this.count === 0 || this.count === 0)
			this.spinner$.next(SpinnerStatus.STOP);
	}

	resetSpinnet() {
		this.count = 0;
		this.spinner$.next(SpinnerStatus.STOP)
	}
}
export enum SpinnerStatus { START='START', STOP='STOP' }