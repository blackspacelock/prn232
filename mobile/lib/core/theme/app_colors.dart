import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // MD3 Color Roles
  static const primary = Color(0xFF005BBF);
  static const primaryContainer = Color(0xFF1A73E8);
  static const onPrimary = Color(0xFFFFFFFF);
  static const onPrimaryContainer = Color(0xFFFFFFFF);
  static const secondary = Color(0xFF005AC1);
  static const secondaryContainer = Color(0xFF4D8EFE);
  static const onSecondary = Color(0xFFFFFFFF);
  static const onSecondaryContainer = Color(0xFF00285C);
  static const surface = Color(0xFFF9F9FF);
  static const surfaceVariant = Color(0xFFE0E2EC);
  static const surfaceContainer = Color(0xFFECEDF7);
  static const surfaceContainerLow = Color(0xFFF2F3FD);
  static const surfaceContainerHigh = Color(0xFFE6E8F2);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerHighest = Color(0xFFE0E2EC);
  static const onSurface = Color(0xFF191C23);
  static const onSurfaceVariant = Color(0xFF414754);
  static const outline = Color(0xFF727785);
  static const outlineVariant = Color(0xFFC1C6D6);
  static const error = Color(0xFFBA1A1A);
  static const errorContainer = Color(0xFFFFDAD6);
  static const onError = Color(0xFFFFFFFF);
  static const success = Color(0xFF1E8E3E);
  static const successContainer = Color(0xFFE6F4EA);
  static const warning = Color(0xFFE37400);
  static const warningContainer = Color(0xFFFEF7E0);
  static const inverseSurface = Color(0xFF2D3038);
  static const inverseOnSurface = Color(0xFFEFF0FA);
  static const inversePrimary = Color(0xFFADC7FF);

  // Node status colors
  static const nodeStatusNotStartedFill = Color(0xFFF1F3F4);
  static const nodeStatusNotStartedText = Color(0xFF5F6368);
  static const nodeStatusNotStartedStroke = Color(0xFFDADCE0);
  static const nodeStatusInProgressFill = Color(0xFFE8F0FE);
  static const nodeStatusInProgressText = Color(0xFF1A73E8);
  static const nodeStatusInProgressStroke = Color(0xFF4285F4);
  static const nodeStatusPausedFill = Color(0xFFFEF7E0);
  static const nodeStatusPausedText = Color(0xFFE37400);
  static const nodeStatusPausedStroke = Color(0xFFFBBC04);
  static const nodeStatusSkippedFill = Color(0xFFF3E8FD);
  static const nodeStatusSkippedText = Color(0xFF7B1FA2);
  static const nodeStatusSkippedStroke = Color(0xFFAB47BC);
  static const nodeStatusDoneFill = Color(0xFFE6F4EA);
  static const nodeStatusDoneText = Color(0xFF1E8E3E);
  static const nodeStatusDoneStroke = Color(0xFF34A853);
}

class NodeStatusColor {
  final Color fill;
  final Color text;
  final Color stroke;
  final String label;
  const NodeStatusColor({
    required this.fill,
    required this.text,
    required this.stroke,
    required this.label,
  });
}

const nodeStatusColors = {
  0: NodeStatusColor(
    fill: AppColors.nodeStatusNotStartedFill,
    text: AppColors.nodeStatusNotStartedText,
    stroke: AppColors.nodeStatusNotStartedStroke,
    label: 'Not Started',
  ),
  1: NodeStatusColor(
    fill: AppColors.nodeStatusInProgressFill,
    text: AppColors.nodeStatusInProgressText,
    stroke: AppColors.nodeStatusInProgressStroke,
    label: 'In Progress',
  ),
  2: NodeStatusColor(
    fill: AppColors.nodeStatusPausedFill,
    text: AppColors.nodeStatusPausedText,
    stroke: AppColors.nodeStatusPausedStroke,
    label: 'Paused',
  ),
  3: NodeStatusColor(
    fill: AppColors.nodeStatusSkippedFill,
    text: AppColors.nodeStatusSkippedText,
    stroke: AppColors.nodeStatusSkippedStroke,
    label: 'Skipped',
  ),
  4: NodeStatusColor(
    fill: AppColors.nodeStatusDoneFill,
    text: AppColors.nodeStatusDoneText,
    stroke: AppColors.nodeStatusDoneStroke,
    label: 'Done',
  ),
};
