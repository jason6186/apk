
package com.example;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class Main extends Application {

    private final ObservableList<Subject> subjects = FXCollections.observableArrayList();
    private final ListView<Subject> subjectListView = new ListView<>();
    private final DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public void start(Stage primaryStage) {
        VBox root = new VBox(10);
        root.setPadding(new Insets(10));

        Label header = new Label("作業追蹤器");
        header.setFont(Font.font(20));
        header.setTextFill(Color.DARKBLUE);

        Button addButton = new Button("新增作業");
        addButton.setOnAction(e -> showAddDialog());

        Button resetButton = new Button("全部設為未繳交");
        resetButton.setOnAction(e -> subjects.forEach(s -> s.setStatus("pending")));

        HBox topButtons = new HBox(10, addButton, resetButton);
        topButtons.setAlignment(Pos.CENTER_LEFT);

        subjectListView.setItems(subjects);
        subjectListView.setCellFactory(list -> new SubjectCell());

        root.getChildren().addAll(header, topButtons, subjectListView);

        Scene scene = new Scene(root, 600, 500);
        primaryStage.setTitle("作業追蹤器 JavaFX");
        primaryStage.setScene(scene);
        primaryStage.show();

        startReminderChecker();
    }

    private void showAddDialog() {
        Stage dialog = new Stage();
        dialog.initModality(Modality.APPLICATION_MODAL);
        dialog.setTitle("新增作業");

        VBox box = new VBox(10);
        box.setPadding(new Insets(10));

        TextField nameField = new TextField();
        nameField.setPromptText("科目名稱");

        CheckBox noLimit = new CheckBox("無期限作業");

        DatePicker dueDate = new DatePicker();
        TextField dueTime = new TextField("23:59");

        DatePicker reminderDate = new DatePicker();
        TextField reminderTime = new TextField("09:00");

        Button confirm = new Button("新增");
        confirm.setOnAction(e -> {
            if (nameField.getText().isEmpty()) return;

            Subject subject = new Subject(
                subjects.size() + 1,
                nameField.getText(),
                dueDate.getValue() != null ? dueDate.getValue().toString() : "",
                dueTime.getText(),
                reminderDate.getValue() != null ? reminderDate.getValue().toString() : "",
                reminderTime.getText(),
                noLimit.isSelected()
            );

            subjects.add(subject);
            dialog.close();
        });

        box.getChildren().addAll(new Label("科目名稱:"), nameField, noLimit,
                new Label("繳交日期:"), dueDate, new Label("繳交時間:"), dueTime,
                new Label("提醒日期:"), reminderDate, new Label("提醒時間:"), reminderTime, confirm);

        Scene scene = new Scene(box, 300, 400);
        dialog.setScene(scene);
        dialog.showAndWait();
    }

    private class SubjectCell extends ListCell<Subject> {
        @Override
        protected void updateItem(Subject subject, boolean empty) {
            super.updateItem(subject, empty);
            if (empty || subject == null) {
                setGraphic(null);
                return;
            }

            VBox box = new VBox(5);
            box.setPadding(new Insets(5));
            box.setStyle("-fx-border-color: gray; -fx-border-radius: 5;");

            Label name = new Label(subject.getName());
            name.setFont(Font.font(16));

            Label due = new Label(subject.isNoLimit() ? "無期限" :
                "截止：" + subject.getDueDate() + " " + subject.getDueTime());

            Label status = new Label("狀態：" + subject.getStatus());
            status.setTextFill(getColorForStatus(subject.getStatus()));

            Button submitBtn = new Button("已繳交");
            submitBtn.setOnAction(e -> {
                subject.setStatus("submitted");
                subject.setSubmittedDate(LocalDateTime.now().format(dateFormat));
                subject.setSubmittedTime(LocalDateTime.now().format(timeFormat));
                subjectListView.refresh();
            });

            Button unknownBtn = new Button("未知");
            unknownBtn.setOnAction(e -> {
                subject.setStatus("unknown");
                subjectListView.refresh();
            });

            Button pendingBtn = new Button("未繳交");
            pendingBtn.setOnAction(e -> {
                subject.setStatus("pending");
                subjectListView.refresh();
            });

            HBox buttons = new HBox(5, submitBtn, unknownBtn, pendingBtn);

            box.getChildren().addAll(name, due, status, buttons);
            setGraphic(box);
        }

        private Color getColorForStatus(String status) {
            return switch (status) {
                case "submitted" -> Color.GREEN;
                case "unknown" -> Color.ORANGE;
                default -> Color.RED;
            };
        }
    }

    private void startReminderChecker() {
        Timer timer = new Timer(true);
        timer.schedule(new TimerTask() {
            public void run() {
                Platform.runLater(() -> {
                    List<Subject> upcoming = new ArrayList<>();
                    LocalDateTime now = LocalDateTime.now();

                    for (Subject s : subjects) {
                        if (s.isNoLimit() || "submitted".equals(s.getStatus())) continue;
                        try {
                            LocalDateTime due = LocalDateTime.parse(s.getDueDate() + "T" + s.getDueTime());
                            long days = Duration.between(now, due).toDays();
                            if (days <= 3 && days >= 0) {
                                upcoming.add(s);
                            }
                        } catch (Exception ignored) {}
                    }

                    if (!upcoming.isEmpty()) {
                        showFullscreenReminder(upcoming);
                    }
                });
            }
        }, 0, 60000); // 每分鐘檢查
    }

    private void showFullscreenReminder(List<Subject> upcomingSubjects) {
        Stage reminderStage = new Stage();
        reminderStage.initStyle(StageStyle.UNDECORATED);
        reminderStage.setFullScreen(true);

        VBox root = new VBox(20);
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color: rgba(255,0,0,0.95);");

        Label title = new Label("以下科目繳交時間快到了！");
        title.setFont(Font.font(30));
        title.setTextFill(Color.WHITE);

        VBox list = new VBox(10);
        for (Subject s : upcomingSubjects) {
            Label l = new Label(s.getName() + " - 截止: " + s.getDueDate() + " " + s.getDueTime());
            l.setTextFill(Color.WHITE);
            list.getChildren().add(l);
        }

        Button close = new Button("我知道了");
        close.setOnAction(e -> reminderStage.close());

        root.getChildren().addAll(title, list, close);

        Scene scene = new Scene(root);
        reminderStage.setScene(scene);
        reminderStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
