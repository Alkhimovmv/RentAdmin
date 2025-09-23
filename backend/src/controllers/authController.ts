import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { pinCode } = req.body;
      const validPinCode = process.env.PIN_CODE || '20031997';

      if (pinCode !== validPinCode) {
        res.status(401).json({ error: 'Неверный пин-код' });
        return;
      }

      const token = jwt.sign(
        { authenticated: true },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        message: 'Успешная авторизация'
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка авторизации' });
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      res.json({ authenticated: true });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка проверки токена' });
    }
  }
}