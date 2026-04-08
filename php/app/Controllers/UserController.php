<?php

declare(strict_types=1);

namespace App\Controllers;

final class UserController
{
    public function current(): never
    {
        if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
            send_json(401, [
                'success' => false,
                'message' => 'Not authenticated.',
            ]);
        }

        send_json(200, [
            'success' => true,
            'user' => $_SESSION['user'],
        ]);
    }
}
