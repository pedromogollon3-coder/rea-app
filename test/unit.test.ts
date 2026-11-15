import { describe, expect, it } from 'vitest';
import { classifyValue, redactCode, redactHar, redactHeaders, redactHtml, redactText, redactUrl } from '../src/core/redact.js';
import { inferSchema, mergeSchemas, schemaToText } from '../src/core/schema.js';
import { assertAllowedUrl, PolicyError, RateLimiter, robotsAllows } from '../src/core/policy.js';
import { templatePath } from '../src/core/network.js';
import { describeBody, isThirdParty, siteOf } from '../src/core/recorder.js';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

describe('enmascarado', () => {
  it('oculta JWT, bearer, correos, claves conocidas y tarjetas válidas', () => {
    const out = redactText(`auth ${JWT} | Authorization: Bearer abcdef1234567890 | ana@example.org | sk_live_abcdefghijklmnop1234 | 4242 4242 4242 4242`);
    expect(out).not.toContain(JWT);
    expect(out).not.toContain('abcdef1234567890');
    expect(out).not.toContain('ana@example.org');
    expect(out).not.toContain('sk_live_');
    expect(out).not.toContain('4242 4242');
    expect(out).toContain('[JWT_ENMASCARADO]');
    expect(out).toContain('[TARJETA_ENMASCARADA]');
  });

  it('no toca números que no son tarjetas ni cambia el número de líneas', () => {
    const text = 'pedido 1234567890123456\nlínea dos\nlínea tres';
    const out = redactText(text);
    expect(out).toContain('1234567890123456');
    expect(out.split('\n')).toHaveLength(3);
  });

  it('enmascara pares clave=valor sensibles', () => {
    expect(redactText('{"access_token":"abc123def456"}')).toBe('{"access_token":"[ENMASCARADO]"}');
    expect(redactText('password=hunter2secret&x=1')).toBe('password=[ENMASCARADO]&x=1');
  });

  it('en código solo toca literales, no expresiones', () => {
    const code = 'const token = getToken(); const apiKey = "AbCdEf1234567890XyZ";';
    const out = redactCode(code);
    expect(out).toContain('getToken()');
    expect(out).not.toContain('AbCdEf1234567890XyZ');
  });

  it('enmascara campos ocultos y metas con token en HTML', () => {
    const html = '<meta name="csrf-token" content="tok-123456"><input type="hidden" name="_csrf" value="zzz999"><input name="q" value="hola">';
    const out = redactHtml(html);
    expect(out).not.toContain('tok-123456');
    expect(out).not.toContain('zzz999');
    expect(out).toContain('value="hola"');
  });

  it('enmascara parámetros sensibles de la URL y credenciales', () => {
    const out = redactUrl(`https://u:p@api.test/v1/x?q=libros&token=abc&sig=${'a'.repeat(40)}`);
    expect(out).toContain('q=libros');
    expect(out).not.toContain('token=abc');
    expect(out).not.toContain('a'.repeat(40));
    expect(out).not.toContain('u:p@');
  });

  it('conserva los nombres de las cookies pero no sus valores', () => {
    const h = redactHeaders({ Cookie: 'sid=secreto123; tema=oscuro', 'Set-Cookie': 'sid=secreto123; Path=/; HttpOnly', Authorization: 'Bearer zzz', 'X-Api-Key': 'k', Accept: 'text/html' });
    expect(h.cookie).toBe('sid=[ENMASCARADO]; tema=[ENMASCARADO]');
    expect(h['set-cookie']).toBe('sid=[ENMASCARADO]; Path=/; HttpOnly');
    expect(h.authorization).toBe('[ENMASCARADO]');
    expect(h['x-api-key']).toBe('[ENMASCARADO]');
    expect(h.accept).toBe('text/html');
  });

  it('limpia un HAR completo', () => {
    const har = {
      log: {
        entries: [
          {
            request: { url: 'https://a.test/?token=abc', headers: [{ name: 'Cookie', value: 'sid=xyz' }], cookies: [{ name: 'sid', value: 'xyz' }], queryString: [{ name: 'token', value: 'abc' }], postData: { text: '{"password":"p"}' } },
            response: { headers: [{ name: 'Set-Cookie', value: 'sid=xyz; Path=/' }], cookies: [{ name: 'sid', value: 'xyz' }], content: { text: 'cuerpo privado' } },
          },
        ],
      },
    };
    const text = JSON.stringify(redactHar(har));
    expect(text).not.toContain('xyz');
    expect(text).not.toContain('abc');
    expect(text).not.toContain('cuerpo privado');
    expect(text).not.toContain('"p"');
  });

  it('clasifica valores sin revelarlos', () => {
    expect(classifyValue(JWT)).toBe('jwt');
    expect(classifyValue('42')).toBe('número');
    expect(classifyValue('{"a":1}')).toBe('json');
    expect(classifyValue('3f2b8c1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b')).toBe('uuid');
    expect(classifyValue('claro')).toBe('texto');
  });
});

describe('esquema JSON', () => {
  it('infiere tipos sin conservar valores', () => {
    const schema = inferSchema({ id: 1, nombre: 'Ana', correo: 'ana@example.org', tags: ['a', 'b'], extra: null, creado: '2025-01-02T10:00:00Z' });
    const text = schemaToText(schema);
    expect(text).toContain('id: number');
    expect(text).toContain('correo: string<email>');
    expect(text).toContain('tags: string[]');
    expect(text).toContain('creado: string<fecha>');
    expect(JSON.stringify(schema)).not.toContain('Ana');
  });

  it('fusiona elementos heterogéneos de un arreglo', () => {
    const schema = inferSchema([{ a: 1 }, { a: 'x', b: true }]);
    expect(schemaToText(schema)).toContain('a: number | string');
    expect(schemaToText(schema)).toContain('b: boolean');
    expect(mergeSchemas({ type: 'number' }, { type: 'number' })).toEqual({ type: 'number' });
  });
});

describe('política', () => {
  it('solo acepta http(s) sin credenciales', () => {
    expect(assertAllowedUrl('https://example.com/a').host).toBe('example.com');
    expect(() => assertAllowedUrl('file:///etc/passwd')).toThrow(PolicyError);
    expect(() => assertAllowedUrl('javascript:alert(1)')).toThrow(PolicyError);
    expect(() => assertAllowedUrl('https://u:p@example.com')).toThrow(PolicyError);
    expect(() => assertAllowedUrl('no es una url')).toThrow(PolicyError);
  });

  it('interpreta robots.txt con la regla más específica', () => {
    const robots = 'User-agent: *\nDisallow: /privado/\nAllow: /privado/publico\n\nUser-agent: rea-app\nDisallow: /solo-rea/';
    expect(robotsAllows(robots, '/', 'otro').allowed).toBe(true);
    expect(robotsAllows(robots, '/privado/x', 'otro').allowed).toBe(false);
    expect(robotsAllows(robots, '/privado/publico/y', 'otro').allowed).toBe(true);
    expect(robotsAllows(robots, '/solo-rea/z', 'rea-app').allowed).toBe(false);
    expect(robotsAllows(robots, '/privado/x', 'rea-app').allowed).toBe(true);
    expect(robotsAllows('', '/lo-que-sea').allowed).toBe(true);
    expect(robotsAllows('User-agent: *\nDisallow: /*.pdf$', '/doc.pdf').allowed).toBe(false);
  });

  it('el limitador espacia las peticiones al mismo host', async () => {
    const limiter = new RateLimiter(120);
    const t0 = Date.now();
    await limiter.wait('a.test');
    await limiter.wait('a.test');
    await limiter.wait('a.test');
    expect(Date.now() - t0).toBeGreaterThanOrEqual(230);
    const t1 = Date.now();
    await limiter.wait('b.test');
    expect(Date.now() - t1).toBeLessThan(60);
  });
});

describe('red', () => {
  it('convierte rutas con identificadores en plantillas', () => {
    expect(templatePath('/users/123/orders/3f2b8c1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b')).toBe('/users/:id/orders/:uuid');
    expect(templatePath('/api/libros')).toBe('/api/libros');
    expect(templatePath('/assets/9f8e7d6c5b4a32109f8e7d6c')).toBe('/assets/:hash');
  });

  it('distingue terceros por dominio registrable', () => {
    expect(siteOf('api.tienda.example.com')).toBe('example.com');
    expect(siteOf('www.tienda.com.mx')).toBe('tienda.com.mx');
    expect(isThirdParty('https://cdn.example.com/a.js', 'www.example.com')).toBe(false);
    expect(isThirdParty('https://www.google-analytics.com/g', 'www.example.com')).toBe(true);
    expect(isThirdParty('http://localhost:3000/api', 'localhost:3000')).toBe(false);
  });

  it('describe cuerpos GraphQL, JSON y formularios sin guardar valores', () => {
    const gql = describeBody(JSON.stringify({ operationName: 'Buscar', query: 'query Buscar($q: String) { libros(q: $q) { id } }', variables: { q: 'secreto' } }), 'application/json');
    expect(gql?.kind).toBe('graphql');
    expect(gql?.graphql).toMatchObject({ type: 'query', name: 'Buscar', variables: ['q'] });
    expect(JSON.stringify(gql)).not.toContain('secreto');
    const form = describeBody('usuario=ana&clave=1234', 'application/x-www-form-urlencoded');
    expect(form).toMatchObject({ kind: 'formulario', params: ['usuario', 'clave'] });
    expect(JSON.stringify(form)).not.toContain('1234');
  });
});
