import * as pulumi from "@pulumi/pulumi";
import * as shipa from "@shipa-corp/pulumi";

const dbapp = new shipa.App("db-create", {
    app: {
        name: "mysql-db",
        framework: "dev",
        teamowner: "shipa-team",
        description: "MySQL DB"
    }
});

export const dbname = dbapp.app.name;

const dbenv = new shipa.AppEnv("db-env", {
    app: dbname,
    appEnv: {
        envs: [
            {name: "MYSQL_DATABASE", value: "wordpress"},
            {name: "MYSQL_USER", value: "shipa"},
            {name: "MYSQL_PASSWORD", value: "shipa"},
            {name: "MYSQL_RANDOM_ROOT_PASSWORD", value: "1"},
        ],
        norestart: false,
        private: true
    }
});

const dbdeploy = new shipa.AppDeploy("db-image-deploy", {
    app: dbname,
    deploy: {
        image: "mysql:5.7"
    }
}, { dependsOn: [dbenv] });


const item = new shipa.NetworkPolicy("mysql-ntpolicy", {
    networkPolicy: {
        app: "mysql-db",
        networkPolicy: {
            ingress: {
                policyMode: "allow-custom-rules-only",
                customRules: [
                    {
                        id: "mysql-ingress",
                        enabled: true,
                        description: "MySQL Wordpress ingress rule",
                        allowedApps: ["wordpress"],
                        ports: [{
                            port: 3306,
                            protocol: "TCP",
                        }]
                    },
                ]
            },
            egress: {
                policyMode: "allow-custom-rules-only",
                customRules: [
                    {
                        id: "mysql-egress",
                        enabled: true,
                        description: "MySQL Wordpress egress rule",
                        allowedApps: ["wordpress"],
                    },
                ]
            },
            restartApp: true,
        }
    }
}, { dependsOn: [dbdeploy] });


const wpapp = new shipa.App("wp-create", {
    app: {
        name: "wordpress",
        framework: "dev",
        teamowner: "shipa-team",
        description: "Wordpress App"
    }
});

export const wpname = wpapp.app.name;

const wpenv = new shipa.AppEnv("wp-env", {
    app: wpname,
    appEnv: {
        envs: [
            {name: "WORDPRESS_DB_HOST", value: "app-mysql-db.shipa-dev.svc"},
            {name: "WORDPRESS_DB_USER", value: "shipa"},
            {name: "WORDPRESS_DB_PASSWORD", value: "shipa"},
            {name: "WORDPRESS_DB_NAME", value: "wordpress"},
        ],
        norestart: true,
        private: true
    }
});

const wpdeploy = new shipa.AppDeploy("wp-image-deploy", {
    app: wpname,
    deploy: {
        image: "wordpress:5.7-php7.4"
    }
}, { dependsOn: [wpenv] });
