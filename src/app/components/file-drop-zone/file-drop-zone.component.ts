import { Component, output, signal, inject, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-file-drop-zone',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './file-drop-zone.component.html',
  styleUrl: './file-drop-zone.component.scss',
})
export class FileDropZoneComponent {
  fileSelected = output<File>();
  error = output<string>();

  isDragging = signal(false);
  isLoading = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      this.error.emit('Format non supporté. Veuillez sélectionner un fichier .gpx');
      return;
    }
    this.isLoading.set(true);
    // Small delay to show loading state
    setTimeout(() => {
      this.isLoading.set(false);
      this.fileSelected.emit(file);
    }, 300);
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }
}