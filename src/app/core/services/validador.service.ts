import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ValidadorService {
  constructor() {}

  validarRut(rut: string): boolean {
    rut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();

    if (!/^[0-9]+[0-9K]$/.test(rut)) return false;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const resto = suma % 11;
    const dvEsperado = 11 - resto;

    let dvCalculado = '';
    if (dvEsperado === 11) {
      dvCalculado = '0';
    } else if (dvEsperado === 10) {
      dvCalculado = 'K';
    } else {
      dvCalculado = dvEsperado.toString();
    }

    return dv === dvCalculado;
  }

  validarContrasenia(pass: string): boolean {
    return pass.length >= 6;
  }

  validarTelefono(telefono: string): boolean {
    return /^\+569\d{8}$/.test(telefono);
  }

  validarCorreo(correo: string): boolean {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(correo);
  }
}
