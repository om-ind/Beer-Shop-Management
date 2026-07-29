import mysql.connector

passwords = ["root", "", "admin", "123456", "1234", "password", "root123", "mysql"]

print("Testing MySQL connection passwords for user 'root'...")

success = False
for pwd in passwords:
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password=pwd
        )
        print(f"\n🎉 SUCCESS! Connected with password: '{pwd}'")
        conn.close()
        success = True
        break
    except mysql.connector.Error as err:
        if err.errno == 1045:
            print(f"Failed with password '{pwd}': Access denied")
        elif err.errno == 2003:
            print("Failed: Can't connect to MySQL server on 'localhost:3306'. Is MySQL service running?")
            break
        else:
            print(f"Failed with password '{pwd}': {err}")

if not success:
    print("\nCould not connect to MySQL with default passwords.")
