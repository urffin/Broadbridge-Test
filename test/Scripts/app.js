angular.module('app', ['ngRoute', 'ui.bootstrap'])
    .controller('state', ['$scope', 'currentState', 'states', '$route', function ($scope, currentState, states, $route) {
        this.activeTabIndex = currentState;
        $scope.$watch(() => this.activeTabIndex, (n, o) => {
            if (n === o) return;
            $route.updateParams({ state: states.byIndex[n] });
        });

    }])
    .controller('addTask', ['$timeout', 'tasks', function ($timeout, tasks) {
        const msInDay = 24 * 60 * 60 * 1000;
        var clearTask = {
            name: '',
            description: '',
            priority: 1,
            timeToComplete: new Date(Date.now() + msInDay)
        };
        this.resetTask = function () {
            this.task = angular.copy(clearTask);
        }
        var timer;
        this.addTask = function () {

            tasks.addTask(this.task).then(() => {
                $timeout.cancel(timer);
                this.resetTask();
                this.successfully = true;
                timer = $timeout(() => this.successfully = false, 2000);
            });
        };
        this.dateOptions = {
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        this.resetTask();
    }])
    .controller('listTask', ['$scope', '$interval', '$location', '$filter', 'tasks', 'moment', 'userSettings', function ($scope, $interval, $location, $filter, tasks, moment, userSettings) {
        const intervalTimeout = 10 * 1000;
        this.columns = [
            { name: 'Name' },
            { name: 'Priority' },
            { name: 'Added' },
            { name: 'Status' },
            { name: 'Time to complete' },
            { name: 'actions' }
        ];
        var statusNameFilter = $filter('statusName');
        this.currentFilter = 0;
        this.filter = function filter(f) {
            this.currentFilter = tasks.statuses[f] || 0;

            this.filteredTasks = this.currentFilter === 0 && this.tasks || this.tasks.filter(t => t.Status == this.currentFilter);
            if (this.currentFilter) {
                $location.search({ filter: statusNameFilter(this.currentFilter) });
            } else {
                $location.search({});
            }
        };
        this.toggleDetails = function toggleDetails(task) {
            if (this.selectedTask !== task)
                this.selectedTask = task;
            else
                this.selectedTask = null;
        }
        this.complete = function complete(task, e) {
            if (e) e.stopPropagation();

            var copy = angular.copy(task);
            tasks.complete(copy).then(r => task.Status = tasks.statuses.Complete);
        }
        this.remove = function remove(task, index, e) {
            e.stopPropagation();

            if (this.selectedTask === task) this.selectedTask = null;

            tasks.remove(task).then(() => this.tasks.splice(index, 1));
        }
        this.settings = userSettings.settings;

        this.refresh = function refresh() {
            tasks.list().then(list => {
                this.tasks = list;
                var filter = $location.search().filter;
                this.filter(filter);
                $interval.cancel(timer);
                timer = $interval(() => {
                    this.tasks.forEach(t => {
                        if (t.Status == tasks.statuses.Complete) return;

                        if (moment() >= moment(t.TimeToComplete)) {
                            this.complete(t);
                        }
                    })
                }, intervalTimeout);
            });
        };
        this.refresh();
        var timer;
        $scope.$on('$destroy', () => { $interval.cancel(timer) })
    }])
    .controller('userSettings', ['$timeout', 'userSettings', function ($timeout, userSettings) {
        this.settings = userSettings.settings;
        this.successfully = false;
        var timer;
        this.updateSettings = function updateSetings() {
            userSettings.saveSettings(this.settings);
            this.successfully = true;
            $timeout.cancel(timer);
            timer = $timeout(() => this.successfully = false, 2000);
        };
    }])
    .factory('moment', function () {
        return moment;
    })
    .filter('toTime', ['moment', 'tasks', function (moment, tasks) {
        return function (task) {
            if (task.Status == tasks.statuses.Complete) return 0;

            var from = moment();
            var to = moment(task.TimeToComplete);
            return from.to(to);
        };
    }])
    .factory('states', function () {
        return {
            byName: { 'add': 1, 'list': 2, 'settings': 3 },
            byIndex: { 1: 'add', 2: 'list', 3: 'settings' }
        }
    })
    .factory('tasks', ['$http', 'moment', function ($http, moment) {
        return {
            statuses: {
                'Active': 1,
                'Complete': 2
            },
            addTask: function (task) {
                var t = angular.copy(task);
                t.timeToComplete = moment(task.timeToComplete).format();
                return $http.post('/api/Tasks', t);
            },
            list: function () {
                return $http.get('/api/Tasks').then(r => r.data);
            },
            complete: function (task) {
                task.Status = this.statuses.Complete;
                return $http.put('/api/Tasks/' + task.Id, task);
            },
            remove: function (task) {
                return $http.delete('/api/Tasks/' + task.Id);
            }
        };
    }])
    .filter('statusName', function () {
        var statuses = {
            1: 'Active',
            2: 'Complete'
        }
        return function (statusId) {
            return statuses[statusId];
        }
    })
    .factory('userSettings', ['$window', '$document', function ($window, $document) {
        const settingsKey = 'userSettingsKey';
        var storage = $window.localStorage;

        var styleElement = angular.element('<style>');
        $document.find('head').append(styleElement);

        var defaultSettings = {
            altRowColor: '#f9f9f9',
            dateTime: 'yyyy-MM-dd HH:mm:ss'
        };
        function applyCssSettings(settings) {
            var rulesSheet = styleElement.prop('sheet');
            while (rulesSheet.cssRules.length) rulesSheet.deleteRule(0);
            rulesSheet.insertRule(`.table-striped > tbody > tr:nth-of-type(odd){background-color:${settings}}`);
        };

        var currentSettings = defaultSettings;

        return {
            get settings() {
                return currentSettings;
            },
            loadSettings: function () {
                currentSettings = storage[settingsKey] ? JSON.parse(storage[settingsKey]) : defaultSettings;
                applyCssSettings(currentSettings.altRowColor);
            },
            saveSettings: function (settings) {
                applyCssSettings(settings.altRowColor)
                currentSettings = settings;
                storage[settingsKey] = JSON.stringify(settings);
            }
        }
    }])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/:state', {
            templateUrl: 'state',
            controller: 'state',
            controllerAs: 'vm',
            resolve: {
                currentState: ['$route', 'states', function ($route, states) {
                    var { state } = $route.current.params;
                    var statesByName = states.byName;
                    if (!statesByName[state]) return Promise.reject('invalid state');
                    return statesByName[state];
                }]
            },
            reloadOnSearch: false
        })
            .otherwise('/add')
    }])
    .run(['$rootScope', '$location', 'userSettings', function ($rootScope, $location, userSettings) {
        $rootScope.$on('$routeChangeError', function () {
            $location.path('add');
        });
        userSettings.loadSettings();
    }])