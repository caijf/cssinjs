import type { CSSObject } from '../src/useStyleRegister';
import { Theme, useCacheToken, useStyleRegister } from '../src';
import { render } from '@testing-library/react';
import * as React from 'react';

interface DesignToken {
  primaryColor: string;
}

interface DerivativeToken extends DesignToken {
  primaryColorDisabled: string;
}

const derivative = (designToken: DesignToken): DerivativeToken => ({
  ...designToken,
  primaryColorDisabled: designToken.primaryColor,
});

const theme = new Theme(derivative);

describe('style warning', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    errorSpy.mockReset();
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  describe('no non-logical properties and values', () => {
    [
      'marginLeft',
      'marginRight',
      'paddingLeft',
      'paddingRight',
      'left',
      'right',
      'borderLeft',
      'borderLeftWidth',
      'borderLeftStyle',
      'borderLeftColor',
      'borderRight',
      'borderRightWidth',
      'borderRightStyle',
      'borderRightColor',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
    ].forEach((prop) => {
      it(`${prop}`, () => {
        const genStyle = (): CSSObject => ({
          [prop]: 1,
        });
        const Demo = () => {
          const [token] = useCacheToken<DerivativeToken>(theme, []);
          useStyleRegister({ theme, token, path: [`${prop}`] }, () => [
            genStyle(),
          ]);
          return <div />;
        };
        render(<Demo />);
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `You seem to be using non-logical property '${prop}'`,
          ),
        );
      });
    });
  });

  it('content value should contain quotes', () => {
    const genStyle = (): CSSObject => ({
      content: 'test',
    });
    const Demo = () => {
      const [token] = useCacheToken<DerivativeToken>(theme, []);
      useStyleRegister({ theme, token, path: ['content'] }, () => [genStyle()]);
      return <div />;
    };
    render(<Demo />);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `You seem to be using a value for 'content' without quotes`,
      ),
    );
  });

  ['margin', 'padding', 'borderWidth', 'borderStyle'].forEach((prop) =>
    it(`${prop} including four directions`, () => {
      const genStyle = (): CSSObject => ({
        [prop]: '0 1px 0 3px',
      });
      const Demo = () => {
        const [token] = useCacheToken<DerivativeToken>(theme, []);
        useStyleRegister({ theme, token, path: [prop] }, () => [genStyle()]);
        return <div />;
      };
      render(<Demo />);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `You seem to be using '${prop}' property with different left ${prop} and right ${prop},`,
        ),
      );
    }),
  );

  ['clear', 'textAlign'].forEach((prop) =>
    it(`${prop} with left or right`, () => {
      const genStyle = (): CSSObject => ({
        [prop]: 'left',
      });
      const Demo = () => {
        const [token] = useCacheToken<DerivativeToken>(theme, []);
        useStyleRegister({ theme, token, path: [prop] }, () => [genStyle()]);
        return <div />;
      };
      render(<Demo />);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `You seem to be using non-logical value 'left' of ${prop},`,
        ),
      );
    }),
  );

  [
    '2px 4px',
    '2px 2px 4px',
    '2px 2px 2px 4px',
    '2px / 2px 4px',
    '2px 4px / 2px 2px',
  ].forEach((value) => {
    it(`borderRadius with value '${value}'`, () => {
      const genStyle = (): CSSObject => ({
        borderRadius: value,
      });
      const Demo = () => {
        const [token] = useCacheToken<DerivativeToken>(theme, []);
        useStyleRegister(
          { theme, token, path: [`borderRadius: ${value}`] },
          () => [genStyle()],
        );
        return <div />;
      };
      render(<Demo />);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `You seem to be using non-logical value '${value}' of borderRadius`,
        ),
      );
    });
  });

  it('skip check should work', () => {
    const genStyle = (): CSSObject => ({
      content: { _skip_check_: true, value: 'content' },
    });
    const Demo = () => {
      const [token] = useCacheToken<DerivativeToken>(theme, []);
      useStyleRegister({ theme, token, path: ['content'] }, () => [genStyle()]);
      return <div />;
    };
    render(<Demo />);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});