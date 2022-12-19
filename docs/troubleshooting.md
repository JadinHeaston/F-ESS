


# ExecuTime Blocked

ExecuTime can occasionally be blocked, especially when the application is running within a Docker container.

This can be remedied by populating the "user_agent" environment variable. A good recommend one right now is: ```Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54```  