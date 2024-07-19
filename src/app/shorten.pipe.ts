import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shorten' })
export class ShortenPipe implements PipeTransform {
  transform(value: string, ...args: string[]): string {  
    return (value.length <= 50) ? value :  `${ value.slice(0, 50) }...`;
  }
}