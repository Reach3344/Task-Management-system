<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use Throwable;

final class UserModel
{
    public function __construct(
        private readonly PDO $connection
    ) {
    }

    public function authenticate(string $username, string $password): ?array
    {
        try {
            $user = $this->findByUsername($username);

            if ($user === null) {
                return null;
            }

            if (!password_verify($password, $user['password'] ?? '')) {
                return null;
            }

            $this->touchLogin((int) $user['id']);

            $freshUser = $this->findById((int) $user['id']);
            return $freshUser === null ? null : $this->publicUser($freshUser);
        } catch (Throwable) {
            send_json(500, [
                'success' => false,
                'message' => 'Failed to authenticate user.',
            ]);
        }
    }

    public function register(string $username, string $email, string $password): array
    {
        try {
            if ($this->findByUsername($username) !== null) {
                send_json(409, [
                    'success' => false,
                    'message' => 'Username already exists.',
                ]);
            }

            if ($this->findByEmail($email) !== null) {
                send_json(409, [
                    'success' => false,
                    'message' => 'Email already registered.',
                ]);
            }

            $statement = $this->connection->prepare(
                'INSERT INTO users (username, email, password, created_at, last_login, login_count)
                 VALUES (:username, :email, :password, NOW(), NOW(), 1)'
            );
            $statement->execute([
                'username' => $username,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
            ]);

            $newUser = $this->findById((int) $this->connection->lastInsertId());

            if ($newUser === null) {
                send_json(500, [
                    'success' => false,
                    'message' => 'User was created, but could not be loaded.',
                ]);
            }

            return $this->publicUser($newUser);
        } catch (Throwable) {
            send_json(500, [
                'success' => false,
                'message' => 'Failed to register user.',
            ]);
        }
    }

    public function publicUser(array $user): array
    {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'createdAt' => $this->normalizeDate($user['created_at'] ?? null),
            'lastLogin' => $this->normalizeDate($user['last_login'] ?? null),
            'loginCount' => $user['login_count'] ?? 0,
        ];
    }

    private function findById(int $id): ?array
    {
        $statement = $this->connection->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);

        $user = $statement->fetch();
        return is_array($user) ? $user : null;
    }

    private function findByUsername(string $username): ?array
    {
        $statement = $this->connection->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $statement->execute(['username' => $username]);

        $user = $statement->fetch();
        return is_array($user) ? $user : null;
    }

    private function findByEmail(string $email): ?array
    {
        $statement = $this->connection->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $statement->execute(['email' => $email]);

        $user = $statement->fetch();
        return is_array($user) ? $user : null;
    }

    private function touchLogin(int $id): void
    {
        $statement = $this->connection->prepare(
            'UPDATE users
             SET login_count = login_count + 1,
                 last_login = NOW()
             WHERE id = :id'
        );
        $statement->execute(['id' => $id]);
    }

    private function normalizeDate(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $timestamp = strtotime($value);
        return $timestamp === false ? $value : date(DATE_ATOM, $timestamp);
    }
}
